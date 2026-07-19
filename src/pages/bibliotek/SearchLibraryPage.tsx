// The library search page (search.md): a debounced field, URL-carried search state,
// grouped finite results and a separate private notes group. Search lives
// in the Library and never takes place in the reading room. No popularity signal.
import { useEffect, useState } from 'react'
import { TopBar } from '../../components/TopBar'
import { searchLibrary } from '../../lib/api'
import type { Note } from '../../lib/personal'
import { searchNotes } from '../../lib/searchNotes'
import { searchIndexData, type SearchType, type SearchParams } from '../../lib/searchIndex'
import { searchInLibrary, visibleHits, type SearchGroup, type VisibleGroup } from '../../lib/searchLogic'
import { normalize } from '../../lib/searchNormalize'
import { anonymizeQuestion, report } from '../../lib/telemetry'
import { useAsync } from '../../lib/useAsync'
import { useAtlas } from '../../lib/store'
import { useDebounced } from '../../lib/useDebounced'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { Filter, SourceTextGroup, ResultView, SearchField, type SourceTextResponse, type SearchMode } from './SearchParts'

// Which groups are expanded, remembered per normalized query across
// navigation within the session (search.md: search state may be temporary).
const expansionMemory = new Map<string, Set<SearchType>>()
const getExpansion = (key: string): Set<SearchType> => new Set(expansionMemory.get(key))

// The shareable search parameter; an empty query and no filter are omitted from the URL.
const searchObject = (term: string, type: SearchType | undefined): SearchParams => ({
  ...(term ? { q: term } : {}),
  ...(type ? { type } : {}),
})

type Derived = {
  visible: VisibleGroup[]
  notes: Note[]
  redaktionellaOchNoter: number
  error: boolean
}

// Derives the editorial results and the private notes group from
// the term. A pure function (outside the component) so the page stays small and readable.
const deriveResult = (
  term: string,
  type: SearchType | undefined,
  expanded: ReadonlySet<SearchType>,
  noteMap: Record<string, Note>,
): Derived => {
  let groups: SearchGroup[] = []
  let error = false
  try {
    groups = searchInLibrary(term, searchIndexData)
  } catch {
    error = true
  }
  const filtered = type ? groups.filter((group) => group.type === type) : groups
  const visible = visibleHits(filtered, expanded)
  const notes = type ? [] : searchNotes(term, noteMap)
  const redaktionellaOchNoter =
    filtered.reduce((sum, group) => sum + group.hits.length, 0) + notes.length
  return { visible, notes, redaktionellaOchNoter, error }
}

const computeMode = (key: string, error: boolean): SearchMode =>
  key.length < 2 ? 'tom' : error ? 'fel' : 'klar'

const EMPTY_SOURCE_TEXT: SourceTextResponse = { books: [], hits: [] }

const sourceTextCountOf = (response: SourceTextResponse | null): number =>
  (response?.books.length ?? 0) + (response?.hits.length ?? 0)

// No hits at all (and the verse search is no longer in flight): only then is
// no-results shown, never while source-text hits are still loading.
const isCompletelyEmpty = (redaktionellaOchNoter: number, sourceTextCount: number, loading: boolean): boolean =>
  redaktionellaOchNoter === 0 && sourceTextCount === 0 && !loading

// Adds an expanded group and saves it in the session memory.
const nyExpansion = (
  previous: ReadonlySet<SearchType>,
  key: string,
  groupType: SearchType,
): Set<SearchType> => {
  const next = new Set(previous).add(groupType)
  expansionMemory.set(key, next)
  return next
}

// The search field's state: debounced value, Enter searches immediately, the term is mirrored in
// the URL and expanded groups are remembered per query. Gathered into a hook so the
// page itself stays small and readable.
const useSoktillstand = (
  q: string,
  type: SearchType | undefined,
  onNavigera: (search: SearchParams) => void,
) => {
  const [query, setQuery] = useState(q)
  const [direkt, setDirekt] = useState<string | null>(null)
  const debounced = useDebounced(query.trim(), 250)
  const term = direkt ?? debounced
  const key = normalize(term)
  const [expanded, setExpanderade] = useState<Set<SearchType>>(() => getExpansion(key))

  useEffect(() => {
    if (term !== q) onNavigera(searchObject(term, type))
  }, [term, q, type, onNavigera])

  useEffect(() => {
    setExpanderade(getExpansion(normalize(term)))
  }, [term])

  return {
    query,
    term,
    key,
    expanded,
    showMore: (groupType: SearchType) => setExpanderade((prev) => nyExpansion(prev, key, groupType)),
    changeQuery: (value: string) => {
      setQuery(value)
      setDirekt(null)
    },
    searchDirect: () => setDirekt(query.trim()),
  }
}

type Props = {
  q: string
  type: SearchType | undefined
  onNavigera: (search: SearchParams) => void
}

export const SearchLibraryPage = ({ q, type, onNavigera }: Props) => {
  useDocumentTitle('Sök i Biblioteket')
  const { query, term, key, expanded, showMore, changeQuery, searchDirect } = useSoktillstand(
    q,
    type,
    onNavigera,
  )
  const noteMap = useAtlas().notes

  // The verse search (the reader's FTS) runs only without a type filter and for a query ≥ 2
  // characters; otherwise an empty response with no network call. Its own path, its own loading.
  const searchSourceText = key.length >= 2 && type === undefined
  const sourceText = useAsync<SourceTextResponse>(
    () => (searchSourceText ? searchLibrary(term) : Promise.resolve(EMPTY_SOURCE_TEXT)),
    [term, searchSourceText],
  )

  const { visible, notes, redaktionellaOchNoter, error } = deriveResult(
    term,
    type,
    expanded,
    noteMap,
  )
  const sourceTextCount = sourceTextCountOf(sourceText.data)
  const count = redaktionellaOchNoter + sourceTextCount
  const noHits = isCompletelyEmpty(redaktionellaOchNoter, sourceTextCount, sourceText.loading)

  // Phase 14: report only the technical minimum from the search — an index error or a
  // completely empty search (anonymized). The notes search never touches this, and
  // the query text is never logged — only length and word count.
  useEffect(() => {
    if (key.length < 2) return
    if (error) report({ type: 'search-error', detail: 'index' })
    else if (noHits) report({ type: 'search-no-hits', ...anonymizeQuestion(term) })
  }, [key, error, noHits, term])

  return (
    <div className="screenSub">
      <TopBar />
      <SearchField query={query} onChange={changeQuery} onSubmit={searchDirect} />
      <Filter active={type} count={count} onVal={(newType) => onNavigera(searchObject(term, newType))} />
      <ResultView
        mode={computeMode(key, error)}
        noHits={noHits}
        visible={visible}
        sourceText={
          type === undefined ? (
            <SourceTextGroup key={key} response={sourceText.data} error={sourceText.error} />
          ) : null
        }
        notes={notes}
        key={key}
        count={count}
        onVisaFler={showMore}
      />
    </div>
  )
}
