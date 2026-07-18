import { describe, expect, it } from 'vitest'
import type { Sokdokument, Soktyp } from './sokindex'
import {
  MAX_SYNLIGA_PER_GRUPP,
  MAX_SYNLIGA_TOTALT,
  sokIBiblioteket,
  synligaTraffar,
  type Sokgrupp,
  type Soktraff,
} from './soklogik'

const dok = (
  type: Soktyp,
  id: string,
  title: string,
  extra: Partial<Sokdokument> = {},
): Sokdokument => ({ type, id, title, alias: [], keywords: [], text: [], ...extra })

// Ett litet blandat index som täcker rankningsscenarierna.
const index: Sokdokument[] = [
  dok('fraga', 'fq-styra', 'Vad kan du styra?'),
  dok('fraga', 'fq-oro', 'Vad gör oron med dagen?', { text: ['oro inför framtiden'] }),
  dok('fraga', 'fq-forl', 'Om förlåtelse', { text: ['att förlåta och försonas'] }),
  dok('fraga', 'fq-mod', 'Mod'),
  dok('fraga', 'fq-mod-vart', 'Vad är mod värt?'),
  dok('tema', 't-lugn', 'Lugn'),
  dok('rum', 'r-angslan', 'Under natten', { text: ['ängslan om natten'] }),
  dok('kalla', 'k-marcus', 'Självbetraktelser', { alias: ['Marcus Aurelius'] }),
  dok('kalla', 'k-oro', 'En skrift om oro', { text: ['oro'] }),
]

const platt = (grupper: Sokgrupp[]): Soktraff[] => grupper.flatMap((grupp) => grupp.traffar)
const idOrdning = (grupper: Sokgrupp[]): string[] => platt(grupper).map((t) => t.dokument.id)
const finns = (grupper: Sokgrupp[], id: string): boolean => idOrdning(grupper).includes(id)

describe('sokIBiblioteket — grundläggande', () => {
  it('ger inget för tom eller för kort fråga', () => {
    expect(sokIBiblioteket('', index)).toEqual([])
    expect(sokIBiblioteket('a', index)).toEqual([])
    expect(sokIBiblioteket('   ', index)).toEqual([])
  })

  it('ger inget när frågan bara är stopord', () => {
    expect(sokIBiblioteket('vad är det som', index)).toEqual([])
  })
})

describe('sokIBiblioteket — rankning', () => {
  it('sätter en exakt frågetitel överst med rätt nivå', () => {
    const grupper = sokIBiblioteket('vad kan du styra', index)
    expect(idOrdning(grupper)[0]).toBe('fq-styra')
    expect(platt(grupper)[0]?.traffatFalt).toBe('title-exakt')
  })

  it('låter exakt title slå en partiell titelträff', () => {
    const grupper = sokIBiblioteket('mod', index)
    const ids = idOrdning(grupper)
    expect(ids.indexOf('fq-mod')).toBeLessThan(ids.indexOf('fq-mod-vart'))
  })

  it('hittar en känd author via aliaset, inte via titeln', () => {
    const grupper = sokIBiblioteket('marcus aurelius', index)
    expect(idOrdning(grupper)[0]).toBe('k-marcus')
    expect(platt(grupper)[0]?.traffatFalt).toBe('alias-exakt')
  })

  it('låter en relevant fråga stå före sources (frågan slår författaren)', () => {
    const grupper = sokIBiblioteket('oro', index)
    expect(grupper[0]?.type).toBe('fraga')
    const ids = idOrdning(grupper)
    expect(ids.indexOf('fq-oro')).toBeLessThan(ids.indexOf('k-oro'))
  })
})

describe('sokIBiblioteket — language och tolerans', () => {
  it('viker svenska diakriter (forlatelse hittar förlåtelse)', () => {
    expect(finns(sokIBiblioteket('forlatelse', index), 'fq-forl')).toBe(true)
  })

  it('tolererar ett skrivfel konservativt', () => {
    expect(finns(sokIBiblioteket('förlåtlse', index), 'fq-forl')).toBe(true)
  })

  it('viker inte ihop korta ord med ett fel (lung hittar inte lugn)', () => {
    expect(finns(sokIBiblioteket('lung', index), 't-lugn')).toBe(false)
  })

  it('expanderar synonymer i båda riktningar', () => {
    expect(finns(sokIBiblioteket('ångest', index), 'fq-oro')).toBe(true)
    expect(finns(sokIBiblioteket('oro', index), 'r-angslan')).toBe(true)
  })

  it('låter inte en kort synonym prefix-matcha ett orelaterat ord', () => {
    // »lugn« har synonymen »ro« — den får inte fastna i »romersk«.
    const medRomersk = [...index, dok('tradition', 't-rom', 'Antik tradition', { text: ['romersk tid'] })]
    expect(finns(sokIBiblioteket('lugn', medRomersk), 't-rom')).toBe(false)
  })
})

describe('sokIBiblioteket — flera ord (AND)', () => {
  it('kräver att alla meningsbärande ord träffar samma dokument', () => {
    expect(finns(sokIBiblioteket('oron dagen', index), 'fq-oro')).toBe(true)
    expect(sokIBiblioteket('oron kartan', index)).toEqual([])
  })
})

describe('synligaTraffar — ändliga resultat', () => {
  const grupp = (type: Soktyp, antal: number): Sokgrupp => ({
    type,
    rubrik: type,
    traffar: Array.from({ length: antal }, (_, i) => ({
      dokument: dok(type, `${type}-${i}`, `${type} ${i}`),
      poang: 100 - i,
      traffatFalt: 'title' as const,
    })),
  })

  it('visar som mest fem per grupp och röjer resten bakom Visa fler', () => {
    const [synlig] = synligaTraffar([grupp('rum', 7)], new Set())
    expect(synlig?.synliga.length).toBe(MAX_SYNLIGA_PER_GRUPP)
    expect(synlig?.dolda).toBe(2)
  })

  it('visar hela gruppen när den är expanderad', () => {
    const [synlig] = synligaTraffar([grupp('rum', 7)], new Set<Soktyp>(['rum']))
    expect(synlig?.synliga.length).toBe(7)
    expect(synlig?.dolda).toBe(0)
  })

  it('håller den samlade initialvyn inom tjugo träffar', () => {
    const grupper = [
      grupp('fraga', 5),
      grupp('tema', 5),
      grupp('rum', 5),
      grupp('vandring', 5),
      grupp('kalla', 5),
    ]
    const totalt = synligaTraffar(grupper, new Set()).reduce((s, g) => s + g.synliga.length, 0)
    expect(totalt).toBeLessThanOrEqual(MAX_SYNLIGA_TOTALT)
  })
})
