// The search algorithm (search.md, Result Ranking): exact/partial matching, Swedish
// normalisation, controlled synonyms and conservative typo tolerance, weighted
// so that questions and themes rank correctly and a famous author never beats a
// more relevant question. No popularity or behaviour signal exists here.
import type { SearchDoc, SearchType } from './searchIndex'
import { inomSkrivfel, normalisera, ordlista, searchTokens, stam } from './searchNormalize'

/** Which field a hit came from — internal, never shown to the user. */
export type HitLevel = 'title-exact' | 'alias-exact' | 'title' | 'keywords' | 'subtitle' | 'text'

/** A hit. `poang`/`traffatFalt` are internal ranking details. */
export type SearchResult = { document: SearchDoc; score: number; matchedField: HitLevel }

/** Hits of the same type, in relevance order. */
export type SearchGroup = { type: SearchType; heading: string; hits: SearchResult[] }

/** A group with the finite selection shown + how many are hidden behind »Visa fler«. */
export type VisibleGroup = { group: SearchGroup; visible: SearchResult[]; hidden: number }

export const MAX_VISIBLE_PER_GROUP = 5
export const MAX_VISIBLE_TOTAL = 20
// Hard cap per group even after »Visa fler« — the result is always finite.
const MAX_PER_GROUP = 20

// Level scores with a gap larger than the biggest type bonus (12), so type order only
// decides within the same level — an exact title always beats a partial alias hit.
const LEVEL_SCORES: Record<HitLevel, number> = {
  'title-exact': 100,
  'alias-exact': 85,
  'title': 60,
  'keywords': 44,
  'subtitle': 28,
  'text': 12,
}

// Questions and themes rank before rooms, paths, sources, traditions and
// people (search.md, Result Priority — the human question comes first;
// a famous author must never automatically beat a directly relevant question).
const TYPE_BONUS: Record<SearchType, number> = {
  fraga: 12,
  tema: 10,
  rum: 8,
  vandring: 6,
  kalla: 4,
  tradition: 2,
  person: 1,
}

/** Swedish group label per search type — shared by the result sections and the type filter. */
export const HEADINGS: Record<SearchType, string> = {
  fraga: 'Frågor',
  tema: 'Teman',
  rum: 'Rum',
  vandring: 'Vandringar',
  kalla: 'Källor',
  tradition: 'Traditioner',
  person: 'Personer',
}

const SYNONYM_FACTOR = 0.7
const TYPO_FACTOR = 0.5

// Controlled synonym map (search.md, Synonyms): broadens recall without
// collapsing important distinctions. Editorially maintained; the key is the hub and
// links bidirectionally to each of its synonyms.
const SYNONYMS: Record<string, string[]> = {
  oro: ['ångest', 'ängslan', 'bekymmer', 'rastlöshet'],
  lugn: ['stillhet', 'ro', 'sinnesro'],
  död: ['döden', 'dödlighet', 'livets slut'],
  mening: ['livsmening', 'syfte'],
  förlåtelse: ['förlåta', 'försoning'],
}

const link = (map: Map<string, Set<string>>, a: string, b: string): void => {
  const neighbors = map.get(a) ?? new Set<string>()
  neighbors.add(b)
  map.set(a, neighbors)
}

// Builds a normalised, bidirectional synonym map: `oro` finds `ångest` and
// `ångest` finds `oro`. Keys and values are folded so matching is diacritic-insensitive.
const buildSynonymMap = (raw: Record<string, string[]>): Map<string, Set<string>> => {
  const map = new Map<string, Set<string>>()
  for (const [nyckel, värden] of Object.entries(raw)) {
    const n = normalisera(nyckel)
    for (const value of värden) {
      const v = normalisera(value)
      link(map, n, v)
      link(map, v, n)
    }
  }
  return map
}

const SYNONYM_MAP = buildSynonymMap(SYNONYMS)

const synonymsFor = (token: string): string[] => [...(SYNONYM_MAP.get(token) ?? [])]

// Match factor between two normalised words: 1 for exact/prefix/stem/substring,
// downweighted for typos, 0 for no hit. Prefix and substring only for longer
// tokens, typos only conservatively (see soknormalisering).
const bestAgainstWord = (token: string, ord: string): number => {
  if (token === ord) return 1
  if (token.length >= 3 && ord.startsWith(token)) return 1
  if (stam(token) === stam(ord)) return 1
  if (token.length >= 4 && ord.includes(token)) return 1
  if (inomSkrivfel(token, ord)) return TYPO_FACTOR
  return 0
}

// Synonyms match conservatively — only whole words or the same stem, never
// arbitrary prefixes/substrings (so »ro« doesn't get stuck in »romersk«).
const synonymHit = (synonym: string, ord: string): boolean =>
  synonym === ord || stam(synonym) === stam(ord)

// Best factor for a token against a field's collection of words, synonyms included.
const factorAgainstBucket = (token: string, ord: string[]): number => {
  let best = 0
  for (const o of ord) {
    const faktor = bestAgainstWord(token, o)
    if (faktor > best) best = faktor
  }
  if (best >= 1) return best
  const synonyms = synonymsFor(token)
  const hit = synonyms.some((synonym) => ord.some((o) => synonymHit(synonym, o)))
  return hit ? Math.max(best, SYNONYM_FACTOR) : best
}

type Bucket = { level: HitLevel; base: number; words: string[] }

// The searchable fields as weighted word collections. Title and alias share the
// strongest level — both are identifying.
const documentBuckets = (dok: SearchDoc): Bucket[] => [
  {
    level: 'title',
    base: LEVEL_SCORES.title,
    words: [...ordlista(dok.title), ...dok.alias.flatMap(ordlista)],
  },
  { level: 'keywords', base: LEVEL_SCORES.keywords, words: dok.keywords.flatMap(ordlista) },
  { level: 'subtitle', base: LEVEL_SCORES.subtitle, words: dok.subtitle ? ordlista(dok.subtitle) : [] },
  { level: 'text', base: LEVEL_SCORES.text, words: dok.text.flatMap(ordlista) },
]

// A token's best score and level across the document's fields.
const tokenBest = (token: string, buckets: Bucket[]): { score: number; level: HitLevel } => {
  let score = 0
  let level: HitLevel = 'text'
  for (const bucket of buckets) {
    const p = bucket.base * factorAgainstBucket(token, bucket.words)
    if (p > score) {
      score = p
      level = bucket.level
    }
  }
  return { score, level }
}

// Exact whole-query hit (punctuation and diacritics normalised away).
const exactLevel = (keyQuery: string, dok: SearchDoc): HitLevel | undefined => {
  if (ordlista(dok.title).join(' ') === keyQuery) return 'title-exact'
  if (dok.alias.some((alias) => ordlista(alias).join(' ') === keyQuery)) return 'alias-exact'
  return undefined
}

// A document hit or nothing. All tokens must match (AND) — search finds
// what you mean without broadening with loosely related results.
const matchDocument = (
  keyQuery: string,
  tokens: string[],
  dok: SearchDoc,
): SearchResult | undefined => {
  const exact = exactLevel(keyQuery, dok)
  if (exact) return { document: dok, score: LEVEL_SCORES[exact] + TYPE_BONUS[dok.type], matchedField: exact }
  if (tokens.length === 0) return undefined
  const buckets = documentBuckets(dok)
  const perToken = tokens.map((token) => tokenBest(token, buckets))
  if (perToken.some((pt) => pt.score <= 0)) return undefined
  const mean = perToken.reduce((sum, pt) => sum + pt.score, 0) / perToken.length
  const best = perToken.reduce((b, pt) => (pt.score > b.score ? pt : b))
  return { document: dok, score: mean + TYPE_BONUS[dok.type], matchedField: best.level }
}

const compareTitleSv = (a: SearchResult, b: SearchResult): number =>
  a.document.title.localeCompare(b.document.title, 'sv')

const bestScore = (grupp: SearchGroup): number => grupp.hits[0]?.score ?? 0

// Groups hits by type; within a group by score and then Swedish title order;
// the groups by best hit, so the most relevant group comes first.
const groupHits = (hits: SearchResult[]): SearchGroup[] => {
  const map = new Map<SearchType, SearchResult[]>()
  for (const hit of hits) {
    const list = map.get(hit.document.type) ?? []
    list.push(hit)
    map.set(hit.document.type, list)
  }
  const grupper = [...map.entries()].map(([type, lista]): SearchGroup => ({
    type,
    heading: HEADINGS[type],
    hits: lista.sort((a, b) => b.score - a.score || compareTitleSv(a, b)).slice(0, MAX_PER_GROUP),
  }))
  return grupper.sort((a, b) => bestScore(b) - bestScore(a))
}

/** The whole search: a query shorter than two characters returns nothing. The groups come in
 * relevance order; each group is finite (never infinite scroll). */
export const searchInLibrary = (question: string, index: SearchDoc[]): SearchGroup[] => {
  const keyQuery = ordlista(question).join(' ')
  if (keyQuery.length < 2) return []
  const tokens = searchTokens(question)
  const hits = index.flatMap((dok) => {
    const hit = matchDocument(keyQuery, tokens, dok)
    return hit ? [hit] : []
  })
  return groupHits(hits)
}

/** The finite initial view: at most five per group and twenty total; an expanded
 * group shows its whole (hard-capped) list. »Visa fler« reveals the rest. */
export const visibleHits = (
  grupper: SearchGroup[],
  expanderade: ReadonlySet<SearchType>,
): VisibleGroup[] => {
  let remaining = MAX_VISIBLE_TOTAL
  return grupper.map((grupp) => {
    const expanderad = expanderade.has(grupp.type)
    const limit = expanderad ? MAX_PER_GROUP : Math.min(MAX_VISIBLE_PER_GROUP, Math.max(remaining, 0))
    const synliga = grupp.hits.slice(0, limit)
    if (!expanderad) remaining -= synliga.length
    return { group: grupp, visible: synliga, hidden: grupp.hits.length - synliga.length }
  })
}
