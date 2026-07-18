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
import { normalisera } from '../../lib/searchNormalize'
import { anonymizeQuestion, report } from '../../lib/telemetry'
import { useAsync } from '../../lib/useAsync'
import { useAtlas } from '../../lib/store'
import { useDebounced } from '../../lib/useDebounced'
import { useSidtitel } from '../../lib/useSidtitel'
import { Filter, SourceTextGroup, ResultView, SearchField, type SourceTextResponse, type SearchMode } from './SokDelar'

// Which groups are expanded, remembered per normalized query across
// navigation within the session (search.md: search state may be temporary).
const expansionsminne = new Map<string, Set<SearchType>>()
const getExpansion = (key: string): Set<SearchType> => new Set(expansionsminne.get(key))

// The shareable search parameter; an empty query and no filter are omitted from the URL.
const searchObject = (term: string, type: SearchType | undefined): SearchParams => ({
  ...(term ? { q: term } : {}),
  ...(type ? { type } : {}),
})

type Derived = {
  synliga: VisibleGroup[]
  notes: Note[]
  redaktionellaOchNoter: number
  fel: boolean
}

// Derives the editorial results and the private notes group from
// the term. A pure function (outside the component) so the page stays small and readable.
const deriveResult = (
  term: string,
  type: SearchType | undefined,
  expanderade: ReadonlySet<SearchType>,
  anteckningar: Record<string, Note>,
): Derived => {
  let grupper: SearchGroup[] = []
  let fel = false
  try {
    grupper = searchInLibrary(term, searchIndexData)
  } catch {
    fel = true
  }
  const filtrerade = type ? grupper.filter((grupp) => grupp.type === type) : grupper
  const synliga = visibleHits(filtrerade, expanderade)
  const notes = type ? [] : searchNotes(term, anteckningar)
  const redaktionellaOchNoter =
    filtrerade.reduce((sum, grupp) => sum + grupp.hits.length, 0) + notes.length
  return { synliga, notes, redaktionellaOchNoter, fel }
}

const computeMode = (key: string, fel: boolean): SearchMode =>
  key.length < 2 ? 'tom' : fel ? 'fel' : 'klar'

const TOMT_KALLTEXTSVAR: SourceTextResponse = { books: [], hits: [] }

const sourceTextCountOf = (svar: SourceTextResponse | null): number =>
  (svar?.books.length ?? 0) + (svar?.hits.length ?? 0)

// No hits at all (and the verse search is no longer in flight): only then is
// no-results shown, never while source-text hits are still loading.
const isCompletelyEmpty = (redaktionellaOchNoter: number, kalltextAntal: number, laddar: boolean): boolean =>
  redaktionellaOchNoter === 0 && kalltextAntal === 0 && !laddar

// Adds an expanded group and saves it in the session memory.
const nyExpansion = (
  previous: ReadonlySet<SearchType>,
  key: string,
  groupType: SearchType,
): Set<SearchType> => {
  const next = new Set(previous).add(groupType)
  expansionsminne.set(key, next)
  return next
}

// The search field's state: debounced value, Enter searches immediately, the term is mirrored in
// the URL and expanded groups are remembered per query. Gathered into a hook so the
// page itself stays small and readable.
const useSoktillstand = (
  q: string,
  type: SearchType | undefined,
  onNavigera: (sök: SearchParams) => void,
) => {
  const [query, setQuery] = useState(q)
  const [direkt, setDirekt] = useState<string | null>(null)
  const debounced = useDebounced(query.trim(), 250)
  const term = direkt ?? debounced
  const key = normalisera(term)
  const [expanderade, setExpanderade] = useState<Set<SearchType>>(() => getExpansion(key))

  useEffect(() => {
    if (term !== q) onNavigera(searchObject(term, type))
  }, [term, q, type, onNavigera])

  useEffect(() => {
    setExpanderade(getExpansion(normalisera(term)))
  }, [term])

  return {
    query,
    term,
    key,
    expanderade,
    visaFler: (groupType: SearchType) => setExpanderade((prev) => nyExpansion(prev, key, groupType)),
    ändraFråga: (value: string) => {
      setQuery(value)
      setDirekt(null)
    },
    sökDirekt: () => setDirekt(query.trim()),
  }
}

type Props = {
  q: string
  type: SearchType | undefined
  onNavigera: (sök: SearchParams) => void
}

export const SokBibliotekPage = ({ q, type, onNavigera }: Props) => {
  useSidtitel('Sök i Biblioteket')
  const { query, term, key, expanderade, visaFler, ändraFråga, sökDirekt } = useSoktillstand(
    q,
    type,
    onNavigera,
  )
  const anteckningar = useAtlas().notes

  // The verse search (the reader's FTS) runs only without a type filter and for a query ≥ 2
  // characters; otherwise an empty response with no network call. Its own path, its own loading.
  const searchSourceText = key.length >= 2 && type === undefined
  const kalltext = useAsync<SourceTextResponse>(
    () => (searchSourceText ? searchLibrary(term) : Promise.resolve(TOMT_KALLTEXTSVAR)),
    [term, searchSourceText],
  )

  const { synliga, notes, redaktionellaOchNoter, fel } = deriveResult(
    term,
    type,
    expanderade,
    anteckningar,
  )
  const kalltextAntal = sourceTextCountOf(kalltext.data)
  const antal = redaktionellaOchNoter + kalltextAntal
  const ingaTraffar = isCompletelyEmpty(redaktionellaOchNoter, kalltextAntal, kalltext.loading)

  // Phase 14: report only the technical minimum from the search — an index error or a
  // completely empty search (anonymized). The notes search never touches this, and
  // the query text is never logged — only length and word count.
  useEffect(() => {
    if (key.length < 2) return
    if (fel) report({ type: 'sokfel', detalj: 'index' })
    else if (ingaTraffar) report({ type: 'sok-nolltraff', ...anonymizeQuestion(term) })
  }, [key, fel, ingaTraffar, term])

  return (
    <div className="screenSub">
      <TopBar />
      <SearchField query={query} onChange={ändraFråga} onSubmit={sökDirekt} />
      <Filter aktiv={type} antal={antal} onVal={(nyTyp) => onNavigera(searchObject(term, nyTyp))} />
      <ResultView
        läge={computeMode(key, fel)}
        ingaTraffar={ingaTraffar}
        synliga={synliga}
        kalltext={
          type === undefined ? (
            <SourceTextGroup key={key} svar={kalltext.data} fel={kalltext.error} />
          ) : null
        }
        notes={notes}
        nyckel={key}
        antal={antal}
        onVisaFler={visaFler}
      />
    </div>
  )
}
