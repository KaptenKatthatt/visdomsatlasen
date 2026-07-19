// The search algorithm (search.md, Result Ranking): exact/partial matching, Swedish
// normalisation, controlled synonyms and conservative typo tolerance, weighted
// so that questions and themes rank correctly and a famous author never beats a
// more relevant question. No popularity or behaviour signal exists here.
import type { SearchDoc, SearchType } from './searchIndex'
import { withinTypo, normalize, wordList, searchTokens, stem } from './searchNormalize'

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
  for (const [key, values] of Object.entries(raw)) {
    const n = normalize(key)
    for (const value of values) {
      const v = normalize(value)
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
const bestAgainstWord = (token: string, word: string): number => {
  if (token === word) return 1
  if (token.length >= 3 && word.startsWith(token)) return 1
  if (stem(token) === stem(word)) return 1
  if (token.length >= 4 && word.includes(token)) return 1
  if (withinTypo(token, word)) return TYPO_FACTOR
  return 0
}

// Synonyms match conservatively — only whole words or the same stem, never
// arbitrary prefixes/substrings (so »ro« doesn't get stuck in »romersk«).
const synonymHit = (synonym: string, word: string): boolean =>
  synonym === word || stem(synonym) === stem(word)

// Best factor for a token against a field's collection of words, synonyms included.
const factorAgainstBucket = (token: string, word: string[]): number => {
  let best = 0
  for (const o of word) {
    const faktor = bestAgainstWord(token, o)
    if (faktor > best) best = faktor
  }
  if (best >= 1) return best
  const synonyms = synonymsFor(token)
  const hit = synonyms.some((synonym) => word.some((o) => synonymHit(synonym, o)))
  return hit ? Math.max(best, SYNONYM_FACTOR) : best
}

type Bucket = { level: HitLevel; base: number; words: string[] }

// The searchable fields as weighted word collections. Title and alias share the
// strongest level — both are identifying.
const documentBuckets = (doc: SearchDoc): Bucket[] => [
  {
    level: 'title',
    base: LEVEL_SCORES.title,
    words: [...wordList(doc.title), ...doc.alias.flatMap(wordList)],
  },
  { level: 'keywords', base: LEVEL_SCORES.keywords, words: doc.keywords.flatMap(wordList) },
  { level: 'subtitle', base: LEVEL_SCORES.subtitle, words: doc.subtitle ? wordList(doc.subtitle) : [] },
  { level: 'text', base: LEVEL_SCORES.text, words: doc.text.flatMap(wordList) },
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
const exactLevel = (keyQuery: string, doc: SearchDoc): HitLevel | undefined => {
  if (wordList(doc.title).join(' ') === keyQuery) return 'title-exact'
  if (doc.alias.some((alias) => wordList(alias).join(' ') === keyQuery)) return 'alias-exact'
  return undefined
}

// A document hit or nothing. All tokens must match (AND) — search finds
// what you mean without broadening with loosely related results.
const matchDocument = (
  keyQuery: string,
  tokens: string[],
  doc: SearchDoc,
): SearchResult | undefined => {
  const exact = exactLevel(keyQuery, doc)
  if (exact) return { document: doc, score: LEVEL_SCORES[exact] + TYPE_BONUS[doc.type], matchedField: exact }
  if (tokens.length === 0) return undefined
  const buckets = documentBuckets(doc)
  const perToken = tokens.map((token) => tokenBest(token, buckets))
  if (perToken.some((pt) => pt.score <= 0)) return undefined
  const mean = perToken.reduce((sum, pt) => sum + pt.score, 0) / perToken.length
  const best = perToken.reduce((b, pt) => (pt.score > b.score ? pt : b))
  return { document: doc, score: mean + TYPE_BONUS[doc.type], matchedField: best.level }
}

const compareTitleSv = (a: SearchResult, b: SearchResult): number =>
  a.document.title.localeCompare(b.document.title, 'sv')

const bestScore = (group: SearchGroup): number => group.hits[0]?.score ?? 0

// Groups hits by type; within a group by score and then Swedish title order;
// the groups by best hit, so the most relevant group comes first.
const groupHits = (hits: SearchResult[]): SearchGroup[] => {
  const map = new Map<SearchType, SearchResult[]>()
  for (const hit of hits) {
    const list = map.get(hit.document.type) ?? []
    list.push(hit)
    map.set(hit.document.type, list)
  }
  const groups = [...map.entries()].map(([type, lista]): SearchGroup => ({
    type,
    heading: HEADINGS[type],
    hits: lista.sort((a, b) => b.score - a.score || compareTitleSv(a, b)).slice(0, MAX_PER_GROUP),
  }))
  return groups.sort((a, b) => bestScore(b) - bestScore(a))
}

/** The whole search: a query shorter than two characters returns nothing. The groups come in
 * relevance order; each group is finite (never infinite scroll). */
export const searchInLibrary = (question: string, index: SearchDoc[]): SearchGroup[] => {
  const keyQuery = wordList(question).join(' ')
  if (keyQuery.length < 2) return []
  const tokens = searchTokens(question)
  const hits = index.flatMap((doc) => {
    const hit = matchDocument(keyQuery, tokens, doc)
    return hit ? [hit] : []
  })
  return groupHits(hits)
}

/** The finite initial view: at most five per group and twenty total; an expanded
 * group shows its whole (hard-capped) list. »Visa fler« reveals the rest. */
export const visibleHits = (
  groups: SearchGroup[],
  expanded: ReadonlySet<SearchType>,
): VisibleGroup[] => {
  let remaining = MAX_VISIBLE_TOTAL
  return groups.map((group) => {
    const isExpanded = expanded.has(group.type)
    const limit = isExpanded ? MAX_PER_GROUP : Math.min(MAX_VISIBLE_PER_GROUP, Math.max(remaining, 0))
    const visible = group.hits.slice(0, limit)
    if (!isExpanded) remaining -= visible.length
    return { group: group, visible: visible, hidden: group.hits.length - visible.length }
  })
}
