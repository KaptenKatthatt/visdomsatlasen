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
    const gammal: SavedRaw = {
      anteckningar: {
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
      vandringsplatser: { 'vandring-x': 'rum-a' },
    } as SavedRaw

    const ut = restoredCollections(gammal)

    expect(ut.notes['rum-a']).toMatchObject({
      originType: 'room',
      originId: 'rum-a',
      created: '2026-06-01T00:00:00.000Z',
      updated: '2026-06-02T00:00:00.000Z',
    })
    expect(ut.savedRooms['rum-a']).toEqual({ savedWhen: '2026-06-03T00:00:00.000Z' })
    expect(ut.savedPaths['vandring-x']).toEqual({ savedWhen: null })
    expect(ut.recentRooms).toEqual(['rum-a', 'rum-b'])
    expect(ut.pathPositions).toEqual({ 'vandring-x': 'rum-a' })
  })

  it('läser nya engelska fältnycklar orörda', () => {
    const ny: SavedRaw = {
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

    const ut = restoredCollections(ny)

    expect(ut.notes['rum-a']?.originId).toBe('rum-a')
    expect(ut.savedRooms['rum-a']).toEqual({ savedWhen: '2026-07-03T00:00:00.000Z' })
    expect(ut.recentRooms).toEqual(['rum-a'])
    expect(ut.pathPositions).toEqual({ 'vandring-x': 'rum-b' })
  })

  it('faller tillbaka på tomma samlingar vid saknad data', () => {
    const ut = restoredCollections({})
    expect(ut.notes).toEqual({})
    expect(ut.savedRooms).toEqual({})
    expect(ut.savedPaths).toEqual({})
    expect(ut.recentRooms).toEqual([])
    expect(ut.pathPositions).toEqual({})
  })
})
