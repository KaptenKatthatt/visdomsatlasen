// Bibliotekssökets sida (search.md): ett debouncat fält, URL-buret sökstate,
// grupperade ändliga resultat och en separat privat anteckningsgrupp. Söket bor
// i Biblioteket och tar aldrig place i läsrummet. Ingen popularitetssignal.
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
import { Filter, SourceTextGroup, Resultatvy, Sokfalt, type SourceTextResponse, type SearchMode } from './SokDelar'

// Vilka grupper som expanderats, ihågkommet per normaliserad fråga över
// navigation inom sessionen (search.md: sökstate får vara tillfälligt).
const expansionsminne = new Map<string, Set<SearchType>>()
const getExpansion = (nyckel: string): Set<SearchType> => new Set(expansionsminne.get(nyckel))

// Den delbara sökparametern; tom fråga och intet filter utelämnas ur URL:en.
const searchObject = (term: string, type: SearchType | undefined): SearchParams => ({
  ...(term ? { q: term } : {}),
  ...(type ? { type } : {}),
})

type Härlett = {
  synliga: VisibleGroup[]
  notes: Note[]
  redaktionellaOchNoter: number
  fel: boolean
}

// Härleder de redaktionella resultaten och den privata anteckningsgruppen ur
// termen. Ren funktion (utanför komponenten) så sidan hålls liten och läsbar.
const deriveResult = (
  term: string,
  type: SearchType | undefined,
  expanderade: ReadonlySet<SearchType>,
  anteckningar: Record<string, Note>,
): Härlett => {
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
    filtrerade.reduce((summa, grupp) => summa + grupp.hits.length, 0) + notes.length
  return { synliga, notes, redaktionellaOchNoter, fel }
}

const computeMode = (nyckel: string, fel: boolean): SearchMode =>
  nyckel.length < 2 ? 'tom' : fel ? 'fel' : 'klar'

const TOMT_KALLTEXTSVAR: SourceTextResponse = { books: [], hits: [] }

const sourceTextCountOf = (svar: SourceTextResponse | null): number =>
  (svar?.books.length ?? 0) + (svar?.hits.length ?? 0)

// Inga träffar alls (och verssöket är inte längre på väg): först då visas
// no-results, aldrig medan källtextträffar fortfarande laddas.
const isCompletelyEmpty = (redaktionellaOchNoter: number, kalltextAntal: number, laddar: boolean): boolean =>
  redaktionellaOchNoter === 0 && kalltextAntal === 0 && !laddar

// Lägger till en expanderad grupp och sparar det i sessionsminnet.
const nyExpansion = (
  föregående: ReadonlySet<SearchType>,
  nyckel: string,
  grupptyp: SearchType,
): Set<SearchType> => {
  const next = new Set(föregående).add(grupptyp)
  expansionsminne.set(nyckel, next)
  return next
}

// Sökfältets tillstånd: debouncat värde, Enter söker direkt, termen speglas i
// URL:en och expanderade grupper minns per fråga. Samlat i en hook så själva
// sidan blir liten och läsbar.
const useSoktillstand = (
  q: string,
  type: SearchType | undefined,
  onNavigera: (sök: SearchParams) => void,
) => {
  const [query, setQuery] = useState(q)
  const [direkt, setDirekt] = useState<string | null>(null)
  const debounced = useDebounced(query.trim(), 250)
  const term = direkt ?? debounced
  const nyckel = normalisera(term)
  const [expanderade, setExpanderade] = useState<Set<SearchType>>(() => getExpansion(nyckel))

  useEffect(() => {
    if (term !== q) onNavigera(searchObject(term, type))
  }, [term, q, type, onNavigera])

  useEffect(() => {
    setExpanderade(getExpansion(normalisera(term)))
  }, [term])

  return {
    query,
    term,
    nyckel,
    expanderade,
    visaFler: (grupptyp: SearchType) => setExpanderade((prev) => nyExpansion(prev, nyckel, grupptyp)),
    ändraFråga: (värde: string) => {
      setQuery(värde)
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
  const { query, term, nyckel, expanderade, visaFler, ändraFråga, sökDirekt } = useSoktillstand(
    q,
    type,
    onNavigera,
  )
  const anteckningar = useAtlas().notes

  // Verssöket (verkläsarens FTS) körs bara utan typfilter och för fråga ≥ 2
  // tecken; annars ett tomt svar utan nätanrop. Egen väg, egen laddning.
  const searchSourceText = nyckel.length >= 2 && type === undefined
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

  // Fas 14: rapportera bara tekniskt minimum ur söket — ett index-fel eller en
  // helt tom sökning (anonymiserat). Anteckningssöket rör detta aldrig, och
  // frågans text loggas aldrig — bara längd och ordantal.
  useEffect(() => {
    if (nyckel.length < 2) return
    if (fel) report({ type: 'sokfel', detalj: 'index' })
    else if (ingaTraffar) report({ type: 'sok-nolltraff', ...anonymizeQuestion(term) })
  }, [nyckel, fel, ingaTraffar, term])

  return (
    <div className="screenSub">
      <TopBar />
      <Sokfalt query={query} onChange={ändraFråga} onSubmit={sökDirekt} />
      <Filter aktiv={type} antal={antal} onVal={(nyTyp) => onNavigera(searchObject(term, nyTyp))} />
      <Resultatvy
        läge={computeMode(nyckel, fel)}
        ingaTraffar={ingaTraffar}
        synliga={synliga}
        kalltext={
          type === undefined ? (
            <SourceTextGroup key={nyckel} svar={kalltext.data} fel={kalltext.error} />
          ) : null
        }
        notes={notes}
        nyckel={nyckel}
        antal={antal}
        onVisaFler={visaFler}
      />
    </div>
  )
}
