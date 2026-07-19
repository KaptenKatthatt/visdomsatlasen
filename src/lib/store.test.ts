import { describe, expect, it } from 'vitest'
import { restoredCollections, type SavedRaw } from './store'

// Phase: English codebase. The persisted collection fields were renamed (anteckningar→
// notes, sparadeRum→savedRooms, sparadeVandringar→savedPaths, senastLastaRum→
// recentRooms, vandringsplatser→pathPositions) and the internal keys of the notes/saved
// entries likewise. An already-deployed app has stored the Swedish
// keys — loading must read them as a fallback so no personal data is
// lost on the upgrade.
describe('restoredCollections (localStorage-migrering till engelska fält)', () => {
  it('läser äldre svenska fältnycklar in i de nya utan förlust', () => {
    const old: SavedRaw = {
      notes: {
        'rum-a': {
          ursprungTyp: 'rum',
          ursprungId: 'rum-a',
          text: 'en tanke',
          skapad: '2026-06-01T00:00:00.000Z',
          uppdaterad: '2026-06-02T00:00:00.000Z',
        },
      },
      sparadeRum: { 'rum-a': { sparadNar: '2026-06-03T00:00:00.000Z' } },
      sparadeVandringar: { 'vandring-x': { sparadNar: null } },
      senastLastaRum: ['rum-a', 'rum-b'],
      pathPositions: { 'vandring-x': 'rum-a' },
    } as SavedRaw

    const out = restoredCollections(old)

    expect(out.notes['rum-a']).toMatchObject({
      originType: 'room',
      originId: 'rum-a',
      created: '2026-06-01T00:00:00.000Z',
      updated: '2026-06-02T00:00:00.000Z',
    })
    expect(out.savedRooms['rum-a']).toEqual({ savedWhen: '2026-06-03T00:00:00.000Z' })
    expect(out.savedPaths['vandring-x']).toEqual({ savedWhen: null })
    expect(out.recentRooms).toEqual(['rum-a', 'rum-b'])
    expect(out.pathPositions).toEqual({ 'vandring-x': 'rum-a' })
  })

  it('läser nya engelska fältnycklar orörda', () => {
    const fresh: SavedRaw = {
      notes: {
        'rum-a': {
          originType: 'room',
          originId: 'rum-a',
          text: 'en tanke',
          created: '2026-07-01T00:00:00.000Z',
          updated: '2026-07-02T00:00:00.000Z',
        },
      },
      savedRooms: { 'rum-a': { savedWhen: '2026-07-03T00:00:00.000Z' } },
      savedPaths: {},
      recentRooms: ['rum-a'],
      pathPositions: { 'vandring-x': 'rum-b' },
    } as SavedRaw

    const out = restoredCollections(fresh)

    expect(out.notes['rum-a']?.originId).toBe('rum-a')
    expect(out.savedRooms['rum-a']).toEqual({ savedWhen: '2026-07-03T00:00:00.000Z' })
    expect(out.recentRooms).toEqual(['rum-a'])
    expect(out.pathPositions).toEqual({ 'vandring-x': 'rum-b' })
  })

  it('faller tillbaka på tomma samlingar vid saknad data', () => {
    const out = restoredCollections({})
    expect(out.notes).toEqual({})
    expect(out.savedRooms).toEqual({})
    expect(out.savedPaths).toEqual({})
    expect(out.recentRooms).toEqual([])
    expect(out.pathPositions).toEqual({})
  })
})
