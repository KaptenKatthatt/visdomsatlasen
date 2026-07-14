import { describe, expect, it } from 'vitest'
import {
  datumEtikett,
  migreraAnteckningar,
  migreraSparade,
  sorteradeAnteckningar,
  sparadeIdITidsordning,
  uppdateradAnteckning,
  utdrag,
  type Anteckning,
} from './personligt'

const NU = '2026-07-14T10:00:00.000Z'

describe('migreraSparade', () => {
  it('migrerar gammal boolean-form: true blir post utan datum, false släpps', () => {
    expect(migreraSparade({ a: true, b: false })).toEqual({ a: { sparadNar: null } })
  })

  it('släpper igenom redan migrerad form orörd (idempotent)', () => {
    const redan = { a: { sparadNar: '2026-07-01T00:00:00.000Z' }, b: { sparadNar: null } }
    expect(migreraSparade(redan)).toEqual(redan)
  })

  it('faller tillbaka på tomt vid korrupt eller saknad indata', () => {
    expect(migreraSparade(null)).toEqual({})
    expect(migreraSparade('trasig')).toEqual({})
    expect(migreraSparade(['a'])).toEqual({})
    expect(migreraSparade({ a: 42 })).toEqual({})
  })
})

describe('migreraAnteckningar', () => {
  const klassificera = (id: string): 'rum' | 'amne' => (id.startsWith('rum-') ? 'rum' : 'amne')

  it('migrerar gamla string-notes till ursprungskopplade poster', () => {
    const ut = migreraAnteckningar({ 'rum-a': 'en tanke', 'amne-b': 'en annan' }, undefined, klassificera, NU)
    expect(ut['rum-a']).toEqual({
      ursprungTyp: 'rum',
      ursprungId: 'rum-a',
      text: 'en tanke',
      skapad: NU,
      uppdaterad: NU,
    })
    expect(ut['amne-b']?.ursprungTyp).toBe('amne')
  })

  it('prunar tomma anteckningar', () => {
    expect(migreraAnteckningar({ a: '   ', b: '' }, undefined, klassificera, NU)).toEqual({})
  })

  it('låter redan migrerad post vinna över gammal string med samma id', () => {
    const ny: Anteckning = {
      ursprungTyp: 'rum',
      ursprungId: 'rum-a',
      text: 'nyare',
      skapad: '2026-06-01T00:00:00.000Z',
      uppdaterad: '2026-06-02T00:00:00.000Z',
    }
    const ut = migreraAnteckningar({ 'rum-a': 'äldre' }, { 'rum-a': ny }, klassificera, NU)
    expect(ut['rum-a']).toEqual(ny)
  })

  it('är idempotent på redan migrerad form', () => {
    const redan = {
      x: { ursprungTyp: 'amne', ursprungId: 'x', text: 't', skapad: NU, uppdaterad: NU },
    }
    expect(migreraAnteckningar(undefined, redan, klassificera, NU)).toEqual(redan)
  })

  it('räddar en korrupt migrerad post med trygga fallbacks men bevarar texten', () => {
    const ut = migreraAnteckningar(undefined, { x: { text: 'kvar' } }, klassificera, NU)
    expect(ut.x).toEqual({ ursprungTyp: 'amne', ursprungId: 'x', text: 'kvar', skapad: NU, uppdaterad: NU })
  })
})

describe('uppdateradAnteckning', () => {
  it('bevarar skapad från befintlig post och flyttar fram uppdaterad', () => {
    const befintlig: Anteckning = {
      ursprungTyp: 'rum',
      ursprungId: 'r',
      text: 'gammal',
      skapad: '2026-06-01T00:00:00.000Z',
      uppdaterad: '2026-06-01T00:00:00.000Z',
    }
    const ut = uppdateradAnteckning(befintlig, 'rum', 'r', 'ny', NU)
    expect(ut.skapad).toBe('2026-06-01T00:00:00.000Z')
    expect(ut.uppdaterad).toBe(NU)
    expect(ut.text).toBe('ny')
  })

  it('sätter skapad till nu för en helt ny anteckning', () => {
    expect(uppdateradAnteckning(undefined, 'amne', 'a', 'text', NU).skapad).toBe(NU)
  })
})

describe('sorteradeAnteckningar', () => {
  it('sorterar senast ändrad först och utelämnar tomma', () => {
    const anteckning = (id: string, uppdaterad: string, text = 'x'): Anteckning => ({
      ursprungTyp: 'rum',
      ursprungId: id,
      text,
      skapad: uppdaterad,
      uppdaterad,
    })
    const ut = sorteradeAnteckningar({
      a: anteckning('a', '2026-07-01T00:00:00.000Z'),
      b: anteckning('b', '2026-07-10T00:00:00.000Z'),
      c: anteckning('c', '2026-07-05T00:00:00.000Z', '  '),
    })
    expect(ut.map((post) => post.ursprungId)).toEqual(['b', 'a'])
  })
})

describe('sparadeIdITidsordning', () => {
  it('sorterar senast sparat först och lägger daterade före odaterade', () => {
    const ut = sparadeIdITidsordning({
      gammal: { sparadNar: '2026-07-01T00:00:00.000Z' },
      utandatum: { sparadNar: null },
      ny: { sparadNar: '2026-07-10T00:00:00.000Z' },
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
    expect(datumEtikett(null)).toBeUndefined()
    expect(datumEtikett('inte-ett-datum')).toBeUndefined()
  })

  it('ger en svensk datumsträng för giltigt ISO-datum', () => {
    const etikett = datumEtikett('2026-07-14T10:00:00.000Z')
    expect(etikett).toContain('2026')
    expect(etikett).toContain('juli')
  })
})
