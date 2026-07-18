import { describe, expect, it } from 'vitest'
import type { SearchDoc, SearchType } from './searchIndex'
import {
  MAX_SYNLIGA_PER_GRUPP,
  MAX_SYNLIGA_TOTALT,
  searchInLibrary,
  visibleHits,
  type SearchGroup,
  type SearchResult,
} from './searchLogic'

const dok = (
  type: SearchType,
  id: string,
  title: string,
  extra: Partial<SearchDoc> = {},
): SearchDoc => ({ type, id, title, alias: [], keywords: [], text: [], ...extra })

// Ett litet blandat index som täcker rankningsscenarierna.
const index: SearchDoc[] = [
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

const platt = (grupper: SearchGroup[]): SearchResult[] => grupper.flatMap((grupp) => grupp.hits)
const idOrdning = (grupper: SearchGroup[]): string[] => platt(grupper).map((t) => t.document.id)
const finns = (grupper: SearchGroup[], id: string): boolean => idOrdning(grupper).includes(id)

describe('sokIBiblioteket — grundläggande', () => {
  it('ger inget för tom eller för kort fråga', () => {
    expect(searchInLibrary('', index)).toEqual([])
    expect(searchInLibrary('a', index)).toEqual([])
    expect(searchInLibrary('   ', index)).toEqual([])
  })

  it('ger inget när frågan bara är stopord', () => {
    expect(searchInLibrary('vad är det som', index)).toEqual([])
  })
})

describe('sokIBiblioteket — rankning', () => {
  it('sätter en exakt frågetitel överst med rätt nivå', () => {
    const grupper = searchInLibrary('vad kan du styra', index)
    expect(idOrdning(grupper)[0]).toBe('fq-styra')
    expect(platt(grupper)[0]?.matchedField).toBe('title-exact')
  })

  it('låter exakt titel slå en partiell titelträff', () => {
    const grupper = searchInLibrary('mod', index)
    const ids = idOrdning(grupper)
    expect(ids.indexOf('fq-mod')).toBeLessThan(ids.indexOf('fq-mod-vart'))
  })

  it('hittar en känd författare via aliaset, inte via titeln', () => {
    const grupper = searchInLibrary('marcus aurelius', index)
    expect(idOrdning(grupper)[0]).toBe('k-marcus')
    expect(platt(grupper)[0]?.matchedField).toBe('alias-exact')
  })

  it('låter en relevant fråga stå före källor (frågan slår författaren)', () => {
    const grupper = searchInLibrary('oro', index)
    expect(grupper[0]?.type).toBe('fraga')
    const ids = idOrdning(grupper)
    expect(ids.indexOf('fq-oro')).toBeLessThan(ids.indexOf('k-oro'))
  })
})

describe('sokIBiblioteket — språk och tolerans', () => {
  it('viker svenska diakriter (forlatelse hittar förlåtelse)', () => {
    expect(finns(searchInLibrary('forlatelse', index), 'fq-forl')).toBe(true)
  })

  it('tolererar ett skrivfel konservativt', () => {
    expect(finns(searchInLibrary('förlåtlse', index), 'fq-forl')).toBe(true)
  })

  it('viker inte ihop korta ord med ett fel (lung hittar inte lugn)', () => {
    expect(finns(searchInLibrary('lung', index), 't-lugn')).toBe(false)
  })

  it('expanderar synonymer i båda riktningar', () => {
    expect(finns(searchInLibrary('ångest', index), 'fq-oro')).toBe(true)
    expect(finns(searchInLibrary('oro', index), 'r-angslan')).toBe(true)
  })

  it('låter inte en kort synonym prefix-matcha ett orelaterat ord', () => {
    // »lugn« har synonymen »ro« — den får inte fastna i »romersk«.
    const medRomersk = [...index, dok('tradition', 't-rom', 'Antik tradition', { text: ['romersk tid'] })]
    expect(finns(searchInLibrary('lugn', medRomersk), 't-rom')).toBe(false)
  })
})

describe('sokIBiblioteket — flera ord (AND)', () => {
  it('kräver att alla meningsbärande ord träffar samma dokument', () => {
    expect(finns(searchInLibrary('oron dagen', index), 'fq-oro')).toBe(true)
    expect(searchInLibrary('oron kartan', index)).toEqual([])
  })
})

describe('synligaTraffar — ändliga resultat', () => {
  const grupp = (type: SearchType, antal: number): SearchGroup => ({
    type,
    heading: type,
    hits: Array.from({ length: antal }, (_, i) => ({
      document: dok(type, `${type}-${i}`, `${type} ${i}`),
      score: 100 - i,
      matchedField: 'title' as const,
    })),
  })

  it('visar som mest fem per grupp och röjer resten bakom Visa fler', () => {
    const [synlig] = visibleHits([grupp('rum', 7)], new Set())
    expect(synlig?.visible.length).toBe(MAX_SYNLIGA_PER_GRUPP)
    expect(synlig?.hidden).toBe(2)
  })

  it('visar hela gruppen när den är expanderad', () => {
    const [synlig] = visibleHits([grupp('rum', 7)], new Set<SearchType>(['rum']))
    expect(synlig?.visible.length).toBe(7)
    expect(synlig?.hidden).toBe(0)
  })

  it('håller den samlade initialvyn inom tjugo träffar', () => {
    const grupper = [
      grupp('fraga', 5),
      grupp('tema', 5),
      grupp('rum', 5),
      grupp('vandring', 5),
      grupp('kalla', 5),
    ]
    const totalt = visibleHits(grupper, new Set()).reduce((s, g) => s + g.visible.length, 0)
    expect(totalt).toBeLessThanOrEqual(MAX_SYNLIGA_TOTALT)
  })
})
