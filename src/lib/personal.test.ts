import { describe, expect, it } from 'vitest'
import {
  dateLabel,
  migrateNotes,
  migrateSaved,
  sortedNotes,
  savedIdsByTime,
  updatedNote,
  excerpt,
  type Note,
} from './personal'

const NU = '2026-07-14T10:00:00.000Z'

describe('migreraSparade', () => {
  it('migrerar gammal boolean-form: true blir post utan datum, false släpps', () => {
    expect(migrateSaved({ a: true, b: false })).toEqual({ a: { savedWhen: null } })
  })

  it('släpper igenom redan migrerad form orörd (idempotent)', () => {
    const already = { a: { savedWhen: '2026-07-01T00:00:00.000Z' }, b: { savedWhen: null } }
    expect(migrateSaved(already)).toEqual(already)
  })

  it('läser den svenska nyckeln sparadNar ur äldre lagring', () => {
    expect(migrateSaved({ a: { sparadNar: '2026-07-01T00:00:00.000Z' }, b: { sparadNar: null } })).toEqual({
      a: { savedWhen: '2026-07-01T00:00:00.000Z' },
      b: { savedWhen: null },
    })
  })

  it('faller tillbaka på tomt vid korrupt eller saknad indata', () => {
    expect(migrateSaved(null)).toEqual({})
    expect(migrateSaved('trasig')).toEqual({})
    expect(migrateSaved(['a'])).toEqual({})
    expect(migrateSaved({ a: 42 })).toEqual({})
  })
})

describe('migreraAnteckningar', () => {
  const classify = (id: string): 'room' | 'topic' => (id.startsWith('rum-') ? 'room' : 'topic')

  it('migrerar gamla string-notes till ursprungskopplade poster', () => {
    const out = migrateNotes({ 'rum-a': 'en tanke', 'amne-b': 'en annan' }, undefined, classify, NU)
    expect(out['rum-a']).toEqual({
      originType: 'room',
      originId: 'rum-a',
      text: 'en tanke',
      created: NU,
      updated: NU,
    })
    expect(out['amne-b']?.originType).toBe('topic')
  })

  it('prunar tomma anteckningar', () => {
    expect(migrateNotes({ a: '   ', b: '' }, undefined, classify, NU)).toEqual({})
  })

  it('låter redan migrerad post vinna över gammal string med samma id', () => {
    const fresh: Note = {
      originType: 'room',
      originId: 'rum-a',
      text: 'nyare',
      created: '2026-06-01T00:00:00.000Z',
      updated: '2026-06-02T00:00:00.000Z',
    }
    const out = migrateNotes({ 'rum-a': 'äldre' }, { 'rum-a': fresh }, classify, NU)
    expect(out['rum-a']).toEqual(fresh)
  })

  it('är idempotent på redan migrerad form', () => {
    const already = {
      x: { originType: 'topic', originId: 'x', text: 't', created: NU, updated: NU },
    }
    expect(migrateNotes(undefined, already, classify, NU)).toEqual(already)
  })

  it('läser äldre poster med svenska nycklar och värden (ursprungTyp/ursprungId, rum→room)', () => {
    // A deployed app before the English migration stored ursprungTyp/ursprungId with
    // the values rum/vandring/amne plus skapad/uppdaterad — none of that may be lost
    // or reset on upgrade.
    const old = {
      x: {
        ursprungTyp: 'rum',
        ursprungId: 'rum-a',
        text: 'en tanke',
        skapad: '2026-05-01T00:00:00.000Z',
        uppdaterad: '2026-05-09T00:00:00.000Z',
      },
    }
    const out = migrateNotes(undefined, old, classify, NU)
    expect(out['x']?.originType).toBe('room')
    expect(out['x']?.originId).toBe('rum-a')
    expect(out['x']?.created).toBe('2026-05-01T00:00:00.000Z')
    expect(out['x']?.updated).toBe('2026-05-09T00:00:00.000Z')
  })

  it('räddar en korrupt migrerad post med trygga fallbacks men bevarar texten', () => {
    const out = migrateNotes(undefined, { x: { text: 'kvar' } }, classify, NU)
    expect(out.x).toEqual({ originType: 'topic', originId: 'x', text: 'kvar', created: NU, updated: NU })
  })
})

describe('uppdateradAnteckning', () => {
  it('bevarar created från befintlig post och flyttar fram updated', () => {
    const existing: Note = {
      originType: 'room',
      originId: 'r',
      text: 'gammal',
      created: '2026-06-01T00:00:00.000Z',
      updated: '2026-06-01T00:00:00.000Z',
    }
    const out = updatedNote(existing, 'room', 'r', 'ny', NU)
    expect(out.created).toBe('2026-06-01T00:00:00.000Z')
    expect(out.updated).toBe(NU)
    expect(out.text).toBe('ny')
  })

  it('sätter created till nu för en helt ny anteckning', () => {
    expect(updatedNote(undefined, 'topic', 'a', 'text', NU).created).toBe(NU)
  })
})

describe('sorteradeAnteckningar', () => {
  it('sorterar senast ändrad först och utelämnar tomma', () => {
    const note = (id: string, updated: string, text = 'x'): Note => ({
      originType: 'room',
      originId: id,
      text,
      created: updated,
      updated,
    })
    const out = sortedNotes({
      a: note('a', '2026-07-01T00:00:00.000Z'),
      b: note('b', '2026-07-10T00:00:00.000Z'),
      c: note('c', '2026-07-05T00:00:00.000Z', '  '),
    })
    expect(out.map((item) => item.originId)).toEqual(['b', 'a'])
  })
})

describe('sparadeIdITidsordning', () => {
  it('sorterar senast sparat först och lägger daterade före odaterade', () => {
    const out = savedIdsByTime({
      gammal: { savedWhen: '2026-07-01T00:00:00.000Z' },
      utandatum: { savedWhen: null },
      ny: { savedWhen: '2026-07-10T00:00:00.000Z' },
    })
    expect(out).toEqual(['ny', 'gammal', 'utandatum'])
  })
})

describe('utdrag', () => {
  it('lämnar korta texter orörda och klipper långa med ellips', () => {
    expect(excerpt('  kort  ')).toBe('kort')
    expect(excerpt('a'.repeat(100))).toBe(`${'a'.repeat(72)}…`)
  })
})

describe('datumEtikett', () => {
  it('ger inget datum för null eller ogiltig sträng', () => {
    expect(dateLabel(null)).toBeUndefined()
    expect(dateLabel('inte-ett-datum')).toBeUndefined()
  })

  it('ger en svensk datumsträng för giltigt ISO-datum', () => {
    const label = dateLabel('2026-07-14T10:00:00.000Z')
    expect(label).toContain('2026')
    expect(label).toContain('juli')
  })
})
