import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { inflateRawSync } from 'node:zlib'
import Database from 'better-sqlite3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AtlasContent } from '../../src/content/editorial/export'
import { runMigrations } from '../db/migrate'
import { buildBundle, createExportRouter, publishToHackytel, type ExportDeps } from './export'

type FixtureBook = { slug: string; name: string; abbrev: string; verses: { chapter: number; verse: number; text: string }[] }

// The Bible sample the ingest's fixture mode uses: Predikaren (chapters 1 and 3) and Markus.
const fixtureBooks = (
  JSON.parse(readFileSync(path.join(process.cwd(), 'data', 'fixtures', 'bible-1917-sample.json'), 'utf-8')) as {
    books: FixtureBook[]
  }
).books

const filledDb = (): Database.Database => {
  const db = new Database(':memory:')
  runMigrations(db)
  db.prepare(
    `INSERT INTO works (id, title, subtitle, tradition, author, lang, translation, license, source_url, translated, position, verse_count)
     VALUES ('bibel-1917', 'Bibeln', '1917 års översättning', 'Kristendom', 'Flera', 'Hebreiska', 'Bibelkommissionen 1917', 'Public domain', 'https://example.org', 0, 0, 0)`,
  ).run()
  const verse = db.prepare(
    `INSERT INTO verses (work_id, book_id, chapter, verse, text) VALUES ('bibel-1917', ?, ?, ?, ?)`,
  )
  fixtureBooks.forEach((book, position) => {
    db.prepare(`INSERT INTO books (id, work_id, name, abbrev, position) VALUES (?, 'bibel-1917', ?, ?, ?)`).run(
      `bibel-1917/${book.slug}`,
      book.name,
      book.abbrev,
      position,
    )
    // Reversed on purpose: the bundle must sort by chapter and verse, not by insertion.
    for (const v of [...book.verses].reverse()) verse.run(`bibel-1917/${book.slug}`, v.chapter, v.verse, v.text)
  })
  return db
}

const content: AtlasContent = {
  format: 1,
  language: 'sv',
  themes: [],
  questions: [],
  traditions: [],
  sources: [],
  passages: [],
  rooms: [],
  paths: [],
}

/** Reads the archive the way unzip tools do: end record, central directory, then each local header. */
const unzip = (zip: Buffer): Map<string, Buffer> => {
  const end = zip.length - 22
  expect(zip.readUInt32LE(end)).toBe(0x06054b50)
  const count = zip.readUInt16LE(end + 10)
  let at = zip.readUInt32LE(end + 16)
  const files = new Map<string, Buffer>()
  for (let i = 0; i < count; i++) {
    expect(zip.readUInt32LE(at)).toBe(0x02014b50)
    const size = zip.readUInt32LE(at + 20)
    const nameLength = zip.readUInt16LE(at + 28)
    const skip = nameLength + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32)
    const name = zip.subarray(at + 46, at + 46 + nameLength).toString('utf-8')
    const local = zip.readUInt32LE(at + 42)
    expect(zip.readUInt32LE(local)).toBe(0x04034b50)
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28)
    files.set(name, inflateRawSync(zip.subarray(start, start + size)))
    at += 46 + skip
  }
  expect(at).toBe(end)
  return files
}

type Manifest = { version: string; builtAt: string; works: { books: { id: string; chapters: number[]; verses: number }[] }[] }

describe('buildBundle', () => {
  it('packar manifestet och en versfil per bok, med punkt i stället för snedstreck', () => {
    const { zip } = buildBundle({ content, db: filledDb(), gitSha: '0123456789abcdef', now: new Date('2026-09-26T12:00:00Z') })
    const files = unzip(zip)
    expect([...files.keys()].sort()).toEqual([
      'manifest.json',
      'verses/bibel-1917.markus.json',
      'verses/bibel-1917.predikaren.json',
    ])
  })

  it('ger manifestet verkens böcker med faktiska kapitelnummer och antal verser', () => {
    const { zip } = buildBundle({ content, db: filledDb(), gitSha: '0123456789abcdef', now: new Date('2026-09-26T12:00:00Z') })
    const manifest = JSON.parse(unzip(zip).get('manifest.json')?.toString('utf-8') ?? '{}') as Manifest
    const predikaren = manifest.works[0]?.books.find((book) => book.id === 'bibel-1917.predikaren')
    expect(predikaren?.chapters).toEqual([1, 3])
    expect(predikaren?.verses).toBe(fixtureBooks[0]?.verses.length)
    expect(manifest.builtAt).toBe('2026-09-26T12:00:00.000Z')
  })

  it('sorterar versfilen på kapitel och vers', () => {
    const { zip } = buildBundle({ content, db: filledDb(), gitSha: 'abc', now: new Date() })
    const verses = JSON.parse(unzip(zip).get('verses/bibel-1917.predikaren.json')?.toString('utf-8') ?? '[]') as [
      number,
      number,
      string,
    ][]
    const keys = verses.map(([chapter, verse]) => chapter * 1000 + verse)
    expect(keys).toEqual([...keys].sort((a, b) => a - b))
    expect(verses[0]?.[2]).toBe(fixtureBooks[0]?.verses[0]?.text)
  })

  it('sätter versionen till sju tecken ur GIT_SHA och antalet verser', () => {
    const { version } = buildBundle({ content, db: filledDb(), gitSha: '0123456789abcdef', now: new Date() })
    const total = fixtureBooks.reduce((n, book) => n + book.verses.length, 0)
    expect(version).toBe(`0123456.${total}`)
  })
})

describe('publishToHackytel', () => {
  it('skickar zippen med bärartoken och kastar aldrig', async () => {
    const seen: { url: string; init: RequestInit | undefined }[] = []
    const ok = await publishToHackytel({
      zip: Buffer.from('zip'),
      url: 'https://hackytel.test/api/atlas/publish',
      token: 'hemlig',
      fetch: (url, init) => {
        seen.push({ url: String(url), init })
        return Promise.resolve(new Response('{"version":"x"}', { status: 200 }))
      },
    })
    expect(ok).toEqual({ status: 200, body: '{"version":"x"}' })
    expect(new Headers(seen[0]?.init?.headers).get('Authorization')).toBe('Bearer hemlig')
    const failed = await publishToHackytel({
      zip: Buffer.from('zip'),
      url: 'https://hackytel.test',
      token: 'hemlig',
      fetch: () => Promise.reject(new Error('nätet är nere')),
    })
    expect(failed).toEqual({ status: 0, body: 'nätet är nere' })
  })
})

describe('POST /api/export/hackytel', () => {
  let dir = ''
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'export-'))
    writeFileSync(path.join(dir, 'atlas-content.json'), JSON.stringify(content))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  const deps = (over: Partial<ExportDeps> = {}): ExportDeps => ({
    db: filledDb(),
    contentPath: path.join(dir, 'atlas-content.json'),
    url: 'https://hackytel.test/api/atlas/publish',
    token: 'hackytel-token',
    gitSha: '0123456789abcdef',
    fetch: () => Promise.resolve(new Response('{"version":"ok"}', { status: 200 })),
    now: () => new Date('2026-09-26T12:00:00Z'),
    verify: (header) => header === 'Bearer ingest-token',
    log: () => undefined,
    ...over,
  })
  const post = (router: ReturnType<typeof createExportRouter>, token = 'ingest-token'): Promise<Response> =>
    Promise.resolve(router.request('/', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }))

  it('svarar 200 med version och Hackytels svar', async () => {
    const res = await post(createExportRouter(deps()))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { version: string; bytes: number; hackytel: { status: number } }
    expect(body.version.startsWith('0123456.')).toBe(true)
    expect(body.bytes).toBeGreaterThan(0)
    expect(body.hackytel.status).toBe(200)
  })

  it('hoppar över när Hackytel inte är konfigurerat', async () => {
    const res = await post(createExportRouter(deps({ url: undefined, token: undefined })))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ skipped: 'not_configured' })
  })

  it('svarar 502 med Hackytels kropp när Hackytel nekar', async () => {
    const fetch400 = () => Promise.resolve(new Response('missing-verses:bibel-1917.markus', { status: 400 }))
    const res = await post(createExportRouter(deps({ fetch: fetch400 })))
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ status: 400, body: 'missing-verses:bibel-1917.markus' })
  })

  it('svarar 500 när innehållsfilen saknas', async () => {
    const res = await post(createExportRouter(deps({ contentPath: path.join(dir, 'saknas.json') })))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ reason: 'no-content' })
  })

  it('svarar 401 på fel token och 405 på GET', async () => {
    const router = createExportRouter(deps())
    expect((await post(router, 'fel')).status).toBe(401)
    expect((await router.request('/')).status).toBe(405)
  })
})
