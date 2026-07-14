import { describe, expect, it } from 'vitest'
import {
  EXPORT_FORMAT,
  lasImport,
  mergaImport,
  tillExport,
  tillMarkdown,
  type PersonligaSamlingar,
} from './dataflytt'
import type { Ursprung } from './personligt'

const titelFor = (typ: Ursprung, id: string): string | undefined => `${typ}:${id}`

const samlingar = (): PersonligaSamlingar => ({
  anteckningar: {
    'rum-a': { ursprungTyp: 'rum', ursprungId: 'rum-a', text: 'en tanke', skapad: '2026-07-01T00:00:00.000Z', uppdaterad: '2026-07-05T00:00:00.000Z' },
  },
  sparadeRum: { 'rum-a': { sparadNar: '2026-07-02T00:00:00.000Z' } },
  sparadeVandringar: { 'vandring-x': { sparadNar: null } },
  bookmarks: { 'topic-1': true, 'topic-2': false },
  chapterBookmarks: {
    'w/b:3': { workId: 'w', bookSlug: 'b', chapter: 3, bookName: 'Boken', savedAt: 10 },
  },
})

describe('tillExport', () => {
  it('bygger en exportpost med format, version och uppslagna titlar', () => {
    const exporten = tillExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    expect(exporten.format).toBe(EXPORT_FORMAT)
    expect(exporten.version).toBe(1)
    expect(exporten.anteckningar[0]?.titel).toBe('rum:rum-a')
    expect(exporten.sparadeRum[0]).toMatchObject({ id: 'rum-a', titel: 'rum:rum-a' })
    expect(exporten.sparadeVandringar[0]?.id).toBe('vandring-x')
    expect(exporten.bokmarken.amnen).toEqual(['topic-1'])
    expect(exporten.bokmarken.kapitel).toHaveLength(1)
  })
})

describe('lasImport', () => {
  it('round-trippar en export genom JSON tillbaka till samma data', () => {
    const exporten = tillExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    const tillbaka = lasImport(JSON.parse(JSON.stringify(exporten)))
    expect(tillbaka).toEqual(exporten)
  })

  it('avvisar fel format, fel version och korrupt indata med null', () => {
    expect(lasImport(null)).toBeNull()
    expect(lasImport('trasig')).toBeNull()
    expect(lasImport({ format: 'något-annat', version: 1 })).toBeNull()
    const exporten = tillExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    expect(lasImport({ ...exporten, version: 2 })).toBeNull()
    expect(lasImport({ ...exporten, anteckningar: 'inte-en-lista' })).toBeNull()
  })
})

describe('mergaImport', () => {
  it('unionar sparade poster och bokmärken utan att röra befintlig data', () => {
    const nuvarande: PersonligaSamlingar = {
      anteckningar: {},
      sparadeRum: { 'rum-b': { sparadNar: '2026-07-09T00:00:00.000Z' } },
      sparadeVandringar: {},
      bookmarks: { egen: true },
      chapterBookmarks: {},
    }
    const importen = tillExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    const ut = mergaImport(nuvarande, importen)
    expect(Object.keys(ut.sparadeRum).sort()).toEqual(['rum-a', 'rum-b'])
    expect(ut.bookmarks).toMatchObject({ egen: true, 'topic-1': true })
    expect(Object.keys(ut.chapterBookmarks)).toEqual(['w/b:3'])
  })

  it('låter den nyast uppdaterade anteckningen vinna vid konflikt', () => {
    const importen = tillExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    const äldre: PersonligaSamlingar = {
      anteckningar: {
        'rum-a': { ursprungTyp: 'rum', ursprungId: 'rum-a', text: 'äldre', skapad: '2026-07-01T00:00:00.000Z', uppdaterad: '2026-07-03T00:00:00.000Z' },
      },
      sparadeRum: {},
      sparadeVandringar: {},
      bookmarks: {},
      chapterBookmarks: {},
    }
    const ut = mergaImport(äldre, importen)
    expect(ut.anteckningar['rum-a']?.text).toBe('en tanke')

    const nyare: PersonligaSamlingar = {
      ...äldre,
      anteckningar: {
        'rum-a': { ursprungTyp: 'rum', ursprungId: 'rum-a', text: 'nyare', skapad: '2026-07-01T00:00:00.000Z', uppdaterad: '2026-07-20T00:00:00.000Z' },
      },
    }
    expect(mergaImport(nyare, importen).anteckningar['rum-a']?.text).toBe('nyare')
  })
})

describe('tillMarkdown', () => {
  it('speglar anteckningar och sparat i läsbar Markdown', () => {
    const md = tillMarkdown(tillExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z'))
    expect(md).toContain('## rum:rum-a')
    expect(md).toContain('en tanke')
    expect(md).toContain('# Sparat')
    expect(md).toContain('- rum:rum-a')
  })
})
