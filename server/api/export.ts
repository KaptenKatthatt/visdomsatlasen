import { readFileSync } from 'node:fs'
import type Database from 'better-sqlite3'
import { Hono } from 'hono'
import type { AtlasContent } from '../../src/content/editorial/export'
import { writeZip, type ZipEntry } from '../lib/zip'

// POST /api/export/hackytel builds Hackytel's atlas bundle and sends it to Hackytel's
// server, which serves it to the E Ink tablet (spec: KaptenKatthatt/hackyytel,
// docs/superpowers/specs/2026-09-24-visdomsatlasen-design.md, "Innehållspaketet").
// The editorial half was written at build time (dist/atlas-content.json); the works and
// their verses live only in the database on the VPS, so they are added here.
//
// The bundle is a zip: manifest.json (the editorial content, the works' structure,
// a version and a build time) plus verses/<bookId>.json per book as [chapter, verse, text].
// A book's id in the database is "<work>/<book>"; in the bundle the slash becomes a dot,
// since the id names a file on Hackytel and a path segment in its URL.

type WorkRow = {
  id: string
  title: string
  subtitle: string | null
  tradition: string
  author: string
  translation: string
  license: string
  translated: number
}
type BookRow = { id: string; workId: string; name: string; abbrev: string }
type ChapterRow = { bookId: string; chapter: number; verses: number }
type VerseRow = { chapter: number; verse: number; text: string }

type BundleBook = { id: string; position: number; name: string; abbrev: string; chapters: number[]; verses: number }
type BundleWork = Omit<WorkRow, 'translated'> & { position: number; translated: boolean; books: BundleBook[] }

const BUNDLE_ID = /^[a-z0-9][a-z0-9.-]*$/

const bundleBookId = (id: string): string => {
  const bundleId = id.replaceAll('/', '.')
  if (!BUNDLE_ID.test(bundleId)) throw new Error(`book id not usable as a file name: ${id}`)
  return bundleId
}

/** Chapter numbers and verse count per book, from the verses themselves (chapters may have gaps). */
const chaptersByBook = (db: Database.Database): Map<string, { chapters: number[]; verses: number }> => {
  const rows = db
    .prepare(
      `SELECT book_id AS bookId, chapter, COUNT(*) AS verses FROM verses
       GROUP BY book_id, chapter ORDER BY book_id, chapter`,
    )
    .all() as ChapterRow[]
  const map = new Map<string, { chapters: number[]; verses: number }>()
  for (const row of rows) {
    const entry = map.get(row.bookId) ?? { chapters: [], verses: 0 }
    entry.chapters.push(row.chapter)
    entry.verses += row.verses
    map.set(row.bookId, entry)
  }
  return map
}

/** The works in the library's order, each with its books that have verses. Works without any are left out. */
const readWorks = (db: Database.Database): { works: BundleWork[]; bookIds: Map<string, string> } => {
  const works = db
    .prepare(
      `SELECT id, title, subtitle, tradition, author, translation, license, translated
       FROM works ORDER BY position, title`,
    )
    .all() as WorkRow[]
  const books = db
    .prepare(`SELECT id, work_id AS workId, name, abbrev FROM books ORDER BY work_id, position`)
    .all() as BookRow[]
  const chapters = chaptersByBook(db)
  const bookIds = new Map<string, string>()
  const bundled = works.map((work) => {
    const own = books.filter((book) => book.workId === work.id && chapters.has(book.id))
    const list = own.map((book, position): BundleBook => {
      const id = bundleBookId(book.id)
      bookIds.set(book.id, id)
      const { chapters: numbers = [], verses = 0 } = chapters.get(book.id) ?? {}
      return { id, position, name: book.name, abbrev: book.abbrev, chapters: numbers, verses }
    })
    return { ...work, translated: work.translated === 1, books: list }
  })
  const kept = bundled.filter((work) => work.books.length > 0)
  return { works: kept.map((work, position) => ({ ...work, position })), bookIds }
}

const versesOf = (db: Database.Database, bookId: string): [number, number, string][] =>
  (
    db
      .prepare(`SELECT chapter, verse, text FROM verses WHERE book_id = ? ORDER BY chapter, verse`)
      .all(bookId) as VerseRow[]
  ).map((row) => [row.chapter, row.verse, row.text])

/** The whole bundle as a zip in memory, and its version "<short sha>.<verse count>". */
export const buildBundle = (o: {
  content: AtlasContent
  db: Database.Database
  gitSha: string
  now: Date
}): { zip: Buffer; version: string } => {
  const { works, bookIds } = readWorks(o.db)
  const total = works.reduce((sum, work) => sum + work.books.reduce((n, book) => n + book.verses, 0), 0)
  const version = `${o.gitSha.slice(0, 7)}.${total}`
  const { format, language, ...editorial } = o.content
  const manifest = { format, version, builtAt: o.now.toISOString(), language, ...editorial, works }
  const entries: ZipEntry[] = [{ name: 'manifest.json', data: Buffer.from(JSON.stringify(manifest), 'utf-8') }]
  for (const [dbId, bundleId] of bookIds) {
    entries.push({ name: `verses/${bundleId}.json`, data: Buffer.from(JSON.stringify(versesOf(o.db, dbId)), 'utf-8') })
  }
  return { zip: writeZip(entries, o.now), version }
}

/** Sends the bundle to Hackytel. Never throws: a network error comes back as status 0 with the message. */
export const publishToHackytel = async (o: {
  zip: Buffer
  url: string
  token: string
  fetch: typeof fetch
}): Promise<{ status: number; body: string }> => {
  try {
    const response = await o.fetch(o.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/zip', Authorization: `Bearer ${o.token}` },
      body: new Uint8Array(o.zip),
      signal: AbortSignal.timeout(60_000),
    })
    return { status: response.status, body: (await response.text()).slice(0, 2000) }
  } catch (error: unknown) {
    return { status: 0, body: error instanceof Error ? error.message : String(error) }
  }
}

export type ExportDeps = {
  db: Database.Database
  contentPath: string
  url: string | undefined
  token: string | undefined
  gitSha: string
  fetch: typeof fetch
  now: () => Date
  verify: (header: string | null) => boolean
  log: (line: string) => void
}

type Outcome = { status: 200 | 500 | 502; body: Record<string, unknown> }

const isAtlasContent = (value: unknown): value is AtlasContent =>
  typeof value === 'object' &&
  value !== null &&
  'format' in value &&
  value.format === 1 &&
  'rooms' in value &&
  Array.isArray(value.rooms)

const readContent = (file: string): AtlasContent | null => {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as unknown
    return isAtlasContent(parsed) ? parsed : null
  } catch {
    return null
  }
}

const runExport = async (deps: ExportDeps): Promise<Outcome> => {
  if (!deps.url || !deps.token) return { status: 200, body: { skipped: 'not_configured' } }
  const content = readContent(deps.contentPath)
  if (!content) return { status: 500, body: { reason: 'no-content' } }
  const { zip, version } = buildBundle({ content, db: deps.db, gitSha: deps.gitSha, now: deps.now() })
  const hackytel = await publishToHackytel({ zip, url: deps.url, token: deps.token, fetch: deps.fetch })
  if (hackytel.status < 200 || hackytel.status > 299) return { status: 502, body: { status: hackytel.status, body: hackytel.body } }
  return { status: 200, body: { version, bytes: zip.length, hackytel } }
}

/** POST / behind the ingest token; every other method is 405. */
export const createExportRouter = (deps: ExportDeps): Hono => {
  const router = new Hono()
  router.post('/', async (c) => {
    if (!deps.verify(c.req.header('Authorization') ?? null)) return c.text('Unauthorized', 401)
    const outcome = await runExport(deps)
    deps.log(`[export] ${outcome.status} ${JSON.stringify(outcome.body)}`)
    return c.json(outcome.body, outcome.status)
  })
  router.all('/', (c) => c.text('Method Not Allowed', 405))
  return router
}
