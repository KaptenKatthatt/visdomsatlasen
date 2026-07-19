import { describe, expect, it } from 'vitest'
import type { SearchDoc, SearchType } from './searchIndex'
import {
  MAX_VISIBLE_PER_GROUP,
  MAX_VISIBLE_TOTAL,
  searchInLibrary,
  visibleHits,
  type SearchGroup,
  type SearchResult,
} from './searchLogic'

const doc = (
  type: SearchType,
  id: string,
  title: string,
  extra: Partial<SearchDoc> = {},
): SearchDoc => ({ type, id, title, alias: [], keywords: [], text: [], ...extra })

// A small mixed index covering the ranking scenarios.
const index: SearchDoc[] = [
  doc('fraga', 'fq-styra', 'Vad kan du styra?'),
  doc('fraga', 'fq-oro', 'Vad gör oron med dagen?', { text: ['oro inför framtiden'] }),
  doc('fraga', 'fq-forl', 'Om förlåtelse', { text: ['att förlåta och försonas'] }),
  doc('fraga', 'fq-mod', 'Mod'),
  doc('fraga', 'fq-mod-vart', 'Vad är mod värt?'),
  doc('tema', 't-lugn', 'Lugn'),
  doc('rum', 'r-angslan', 'Under natten', { text: ['ängslan om natten'] }),
  doc('kalla', 'k-marcus', 'Självbetraktelser', { alias: ['Marcus Aurelius'] }),
  doc('kalla', 'k-oro', 'En skrift om oro', { text: ['oro'] }),
]

const platt = (groups: SearchGroup[]): SearchResult[] => groups.flatMap((group) => group.hits)
const idOrdning = (groups: SearchGroup[]): string[] => platt(groups).map((t) => t.document.id)
const exists = (groups: SearchGroup[], id: string): boolean => idOrdning(groups).includes(id)

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
    const groups = searchInLibrary('vad kan du styra', index)
    expect(idOrdning(groups)[0]).toBe('fq-styra')
    expect(platt(groups)[0]?.matchedField).toBe('title-exact')
  })

  it('låter exakt titel slå en partiell titelträff', () => {
    const groups = searchInLibrary('mod', index)
    const ids = idOrdning(groups)
    expect(ids.indexOf('fq-mod')).toBeLessThan(ids.indexOf('fq-mod-vart'))
  })

  it('hittar en känd författare via aliaset, inte via titeln', () => {
    const groups = searchInLibrary('marcus aurelius', index)
    expect(idOrdning(groups)[0]).toBe('k-marcus')
    expect(platt(groups)[0]?.matchedField).toBe('alias-exact')
  })

  it('låter en relevant fråga stå före källor (frågan slår författaren)', () => {
    const groups = searchInLibrary('oro', index)
    expect(groups[0]?.type).toBe('fraga')
    const ids = idOrdning(groups)
    expect(ids.indexOf('fq-oro')).toBeLessThan(ids.indexOf('k-oro'))
  })
})

describe('sokIBiblioteket — språk och tolerans', () => {
  it('viker svenska diakriter (forlatelse hittar förlåtelse)', () => {
    expect(exists(searchInLibrary('forlatelse', index), 'fq-forl')).toBe(true)
  })

  it('tolererar ett skrivfel konservativt', () => {
    expect(exists(searchInLibrary('förlåtlse', index), 'fq-forl')).toBe(true)
  })

  it('viker inte ihop korta ord med ett fel (lung hittar inte lugn)', () => {
    expect(exists(searchInLibrary('lung', index), 't-lugn')).toBe(false)
  })

  it('expanderar synonymer i båda riktningar', () => {
    expect(exists(searchInLibrary('ångest', index), 'fq-oro')).toBe(true)
    expect(exists(searchInLibrary('oro', index), 'r-angslan')).toBe(true)
  })

  it('låter inte en kort synonym prefix-matcha ett orelaterat ord', () => {
    // »lugn« has the synonym »ro« — it must not get stuck in »romersk«.
    const withRoman = [...index, doc('tradition', 't-rom', 'Antik tradition', { text: ['romersk tid'] })]
    expect(exists(searchInLibrary('lugn', withRoman), 't-rom')).toBe(false)
  })
})

describe('sokIBiblioteket — flera ord (AND)', () => {
  it('kräver att alla meningsbärande ord träffar samma dokument', () => {
    expect(exists(searchInLibrary('oron dagen', index), 'fq-oro')).toBe(true)
    expect(searchInLibrary('oron kartan', index)).toEqual([])
  })
})

describe('synligaTraffar — ändliga resultat', () => {
  const group = (type: SearchType, count: number): SearchGroup => ({
    type,
    heading: type,
    hits: Array.from({ length: count }, (_, i) => ({
      document: doc(type, `${type}-${i}`, `${type} ${i}`),
      score: 100 - i,
      matchedField: 'title' as const,
    })),
  })

  it('visar som mest fem per grupp och röjer resten bakom Visa fler', () => {
    const [visible] = visibleHits([group('rum', 7)], new Set())
    expect(visible?.visible.length).toBe(MAX_VISIBLE_PER_GROUP)
    expect(visible?.hidden).toBe(2)
  })

  it('visar hela gruppen när den är expanderad', () => {
    const [visible] = visibleHits([group('rum', 7)], new Set<SearchType>(['rum']))
    expect(visible?.visible.length).toBe(7)
    expect(visible?.hidden).toBe(0)
  })

  it('håller den samlade initialvyn inom tjugo träffar', () => {
    const groups = [
      group('fraga', 5),
      group('tema', 5),
      group('rum', 5),
      group('vandring', 5),
      group('kalla', 5),
    ]
    const total = visibleHits(groups, new Set()).reduce((s, g) => s + g.visible.length, 0)
    expect(total).toBeLessThanOrEqual(MAX_VISIBLE_TOTAL)
  })
})
