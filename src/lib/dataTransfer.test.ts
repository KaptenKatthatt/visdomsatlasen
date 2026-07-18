import { describe, expect, it } from 'vitest'
import {
  EXPORT_FORMAT,
  readImport,
  mergeImport,
  toExport,
  toMarkdown,
  type PersonalCollections,
} from './dataTransfer'
import type { Origin } from './personal'

const titelFor = (type: Origin, id: string): string | undefined => `${type}:${id}`

const samlingar = (): PersonalCollections => ({
  notes: {
    'rum-a': { originType: 'room', originId: 'rum-a', text: 'en tanke', created: '2026-07-01T00:00:00.000Z', updated: '2026-07-05T00:00:00.000Z' },
  },
  savedRooms: { 'rum-a': { savedWhen: '2026-07-02T00:00:00.000Z' } },
  savedPaths: { 'vandring-x': { savedWhen: null } },
  bookmarks: { 'topic-1': true, 'topic-2': false },
  chapterBookmarks: {
    'w/b:3': { workId: 'w', bookSlug: 'b', chapter: 3, bookName: 'Boken', savedAt: 10 },
  },
})

describe('tillExport', () => {
  it('bygger en exportpost med format, version och uppslagna titlar', () => {
    const exporten = toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    expect(exporten.format).toBe(EXPORT_FORMAT)
    expect(exporten.version).toBe(1)
    expect(exporten.notes[0]?.title).toBe('room:rum-a')
    expect(exporten.savedRooms[0]).toMatchObject({ id: 'rum-a', title: 'room:rum-a' })
    expect(exporten.savedPaths[0]?.id).toBe('vandring-x')
    expect(exporten.bookmarks.topics).toEqual(['topic-1'])
    expect(exporten.bookmarks.chapters).toHaveLength(1)
  })
})

describe('lasImport', () => {
  it('round-trippar en export genom JSON tillbaka till samma data', () => {
    const exporten = toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    const tillbaka = readImport(JSON.parse(JSON.stringify(exporten)))
    expect(tillbaka).toEqual(exporten)
  })

  it('avvisar fel format, fel version och korrupt indata med null', () => {
    expect(readImport(null)).toBeNull()
    expect(readImport('trasig')).toBeNull()
    expect(readImport({ format: 'något-annat', version: 1 })).toBeNull()
    const exporten = toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    expect(readImport({ ...exporten, version: 2 })).toBeNull()
    expect(readImport({ ...exporten, notes: 'inte-en-lista' })).toBeNull()
  })

  it('importerar en äldre export med svenska nycklar och värden utan förlust', () => {
    // Backup created before the English migration: the container, note-field and
    // bookmark keys are Swedish (exporterad/anteckningar/sparadeRum/…,
    // ursprungTyp/ursprungId with rum/vandring, sparadNar, bokmarken/kapitel/amnen).
    const gammal = {
      format: EXPORT_FORMAT,
      version: 1,
      exporterad: '2026-07-01T00:00:00.000Z',
      anteckningar: [
        { ursprungTyp: 'rum', ursprungId: 'rum-a', text: 'en tanke', skapad: '2026-06-01T00:00:00.000Z', uppdaterad: '2026-06-02T00:00:00.000Z' },
      ],
      sparadeRum: [{ id: 'rum-a', sparadNar: '2026-06-03T00:00:00.000Z' }],
      sparadeVandringar: [{ id: 'vandring-x', sparadNar: null }],
      bokmarken: { kapitel: [], amnen: ['topic-1'] },
    }
    const ut = readImport(gammal)
    expect(ut).not.toBeNull()
    expect(ut?.notes[0]).toMatchObject({
      originType: 'room',
      originId: 'rum-a',
      created: '2026-06-01T00:00:00.000Z',
      updated: '2026-06-02T00:00:00.000Z',
    })
    expect(ut?.savedRooms[0]).toMatchObject({ id: 'rum-a', savedWhen: '2026-06-03T00:00:00.000Z' })
    expect(ut?.savedPaths[0]).toMatchObject({ id: 'vandring-x', savedWhen: null })
    expect(ut?.bookmarks.topics).toEqual(['topic-1'])
  })
})

describe('mergaImport', () => {
  it('unionar sparade poster och bokmärken utan att röra befintlig data', () => {
    const current: PersonalCollections = {
      notes: {},
      savedRooms: { 'rum-b': { savedWhen: '2026-07-09T00:00:00.000Z' } },
      savedPaths: {},
      bookmarks: { egen: true },
      chapterBookmarks: {},
    }
    const importen = toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    const ut = mergeImport(current, importen)
    expect(Object.keys(ut.savedRooms).sort()).toEqual(['rum-a', 'rum-b'])
    expect(ut.bookmarks).toMatchObject({ egen: true, 'topic-1': true })
    expect(Object.keys(ut.chapterBookmarks)).toEqual(['w/b:3'])
  })

  it('låter den nyast uppdaterade anteckningen vinna vid konflikt', () => {
    const importen = toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z')
    const older: PersonalCollections = {
      notes: {
        'rum-a': { originType: 'room', originId: 'rum-a', text: 'äldre', created: '2026-07-01T00:00:00.000Z', updated: '2026-07-03T00:00:00.000Z' },
      },
      savedRooms: {},
      savedPaths: {},
      bookmarks: {},
      chapterBookmarks: {},
    }
    const ut = mergeImport(older, importen)
    expect(ut.notes['rum-a']?.text).toBe('en tanke')

    const nyare: PersonalCollections = {
      ...older,
      notes: {
        'rum-a': { originType: 'room', originId: 'rum-a', text: 'nyare', created: '2026-07-01T00:00:00.000Z', updated: '2026-07-20T00:00:00.000Z' },
      },
    }
    expect(mergeImport(nyare, importen).notes['rum-a']?.text).toBe('nyare')
  })
})

describe('tillMarkdown', () => {
  it('speglar anteckningar och sparat i läsbar Markdown', () => {
    const md = toMarkdown(toExport(samlingar(), titelFor, '2026-07-14T10:00:00.000Z'))
    expect(md).toContain('## room:rum-a')
    expect(md).toContain('en tanke')
    expect(md).toContain('Skapad 2026-07-01T00:00:00.000Z')
    expect(md).toContain('uppdaterad 2026-07-05T00:00:00.000Z')
    expect(md).toContain('# Sparat')
    expect(md).toContain('- room:rum-a')
  })
})
