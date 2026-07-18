import { describe, expect, it } from 'vitest'
import {
  dateLabel,
  migrateNotes,
  migrateSaved,
  sortedNotes,
  savedIdsByTime,
  updatedNote,
  utdrag,
  type Note,
} from './personal'

const NU = '2026-07-14T10:00:00.000Z'

describe('migreraSparade', () => {
  it('migrerar gammal boolean-form: true blir post utan datum, false släpps', () => {
    expect(migrateSaved({ a: true, b: false })).toEqual({ a: { savedWhen: null } })
  })

  it('släpper igenom redan migrerad form orörd (idempotent)', () => {
    const redan = { a: { savedWhen: '2026-07-01T00:00:00.000Z' }, b: { savedWhen: null } }
    expect(migrateSaved(redan)).toEqual(redan)
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
    const ut = migrateNotes({ 'rum-a': 'en tanke', 'amne-b': 'en annan' }, undefined, classify, NU)
    expect(ut['rum-a']).toEqual({
      originType: 'room',
      originId: 'rum-a',
      text: 'en tanke',
      created: NU,
      updated: NU,
    })
    expect(ut['amne-b']?.originType).toBe('topic')
  })

  it('prunar tomma anteckningar', () => {
    expect(migrateNotes({ a: '   ', b: '' }, undefined, classify, NU)).toEqual({})
  })

  it('låter redan migrerad post vinna över gammal string med samma id', () => {
    const ny: Note = {
      originType: 'room',
      originId: 'rum-a',
      text: 'nyare',
      created: '2026-06-01T00:00:00.000Z',
      updated: '2026-06-02T00:00:00.000Z',
    }
    const ut = migrateNotes({ 'rum-a': 'äldre' }, { 'rum-a': ny }, classify, NU)
    expect(ut['rum-a']).toEqual(ny)
  })

  it('är idempotent på redan migrerad form', () => {
    const redan = {
      x: { originType: 'topic', originId: 'x', text: 't', created: NU, updated: NU },
    }
    expect(migrateNotes(undefined, redan, classify, NU)).toEqual(redan)
  })

  it('läser äldre poster med svenska nycklar och värden (ursprungTyp/ursprungId, rum→room)', () => {
    // Deployad app före engelsk-migreringen lagrade ursprungTyp/ursprungId med
    // värdena rum/vandring/amne samt skapad/uppdaterad — inget av det får tappas
    // eller nollställas vid uppgradering.
    const gammal = {
      x: {
        ursprungTyp: 'rum',
        ursprungId: 'rum-a',
        text: 'en tanke',
        skapad: '2026-05-01T00:00:00.000Z',
        uppdaterad: '2026-05-09T00:00:00.000Z',
      },
    }
    const ut = migrateNotes(undefined, gammal, classify, NU)
    expect(ut['x']?.originType).toBe('room')
    expect(ut['x']?.originId).toBe('rum-a')
    expect(ut['x']?.created).toBe('2026-05-01T00:00:00.000Z')
    expect(ut['x']?.updated).toBe('2026-05-09T00:00:00.000Z')
  })

  it('räddar en korrupt migrerad post med trygga fallbacks men bevarar texten', () => {
    const ut = migrateNotes(undefined, { x: { text: 'kvar' } }, classify, NU)
    expect(ut.x).toEqual({ originType: 'topic', originId: 'x', text: 'kvar', created: NU, updated: NU })
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
    const ut = updatedNote(existing, 'room', 'r', 'ny', NU)
    expect(ut.created).toBe('2026-06-01T00:00:00.000Z')
    expect(ut.updated).toBe(NU)
    expect(ut.text).toBe('ny')
  })

  it('sätter created till nu för en helt ny anteckning', () => {
    expect(updatedNote(undefined, 'topic', 'a', 'text', NU).created).toBe(NU)
  })
})

describe('sorteradeAnteckningar', () => {
  it('sorterar senast ändrad först och utelämnar tomma', () => {
    const anteckning = (id: string, updated: string, text = 'x'): Note => ({
      originType: 'room',
      originId: id,
      text,
      created: updated,
      updated,
    })
    const ut = sortedNotes({
      a: anteckning('a', '2026-07-01T00:00:00.000Z'),
      b: anteckning('b', '2026-07-10T00:00:00.000Z'),
      c: anteckning('c', '2026-07-05T00:00:00.000Z', '  '),
    })
    expect(ut.map((post) => post.originId)).toEqual(['b', 'a'])
  })
})

describe('sparadeIdITidsordning', () => {
  it('sorterar senast sparat först och lägger daterade före odaterade', () => {
    const ut = savedIdsByTime({
      gammal: { savedWhen: '2026-07-01T00:00:00.000Z' },
      utandatum: { savedWhen: null },
      ny: { savedWhen: '2026-07-10T00:00:00.000Z' },
    })
    expect(ut).toEqual(['ny', 'gammal', 'utandatum'])
  })
})

describe('utdrag', () => {
  it('lämnar korta texter orörda och klipper långa med ellips', () => {
    expect(utdrag('  kort  ')).toBe('kort')
    expect(utdrag('a'.repeat(100))).toBe(`${'a'.repeat(72)}…`)
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
