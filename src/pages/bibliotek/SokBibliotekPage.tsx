// Bibliotekssökets sida (search.md): ett debouncat fält, URL-buret sökstate,
// grupperade ändliga resultat och en separat privat anteckningsgrupp. Söket bor
// i Biblioteket och tar aldrig place i läsrummet. Ingen popularitetssignal.
import { useEffect, useState } from 'react'
import { TopBar } from '../../components/TopBar'
import { searchLibrary } from '../../lib/api'
import type { Note } from '../../lib/personligt'
import { sokAnteckningar } from '../../lib/sokanteckningar'
import { sokindexet, type SearchType, type SearchParams } from '../../lib/sokindex'
import { sokIBiblioteket, synligaTraffar, type SearchGroup, type VisibleGroup } from '../../lib/soklogik'
import { normalisera } from '../../lib/soknormalisering'
import { anonymiseraFraga, rapportera } from '../../lib/telemetri'
import { useAsync } from '../../lib/useAsync'
import { useAtlas } from '../../lib/store'
import { useDebounced } from '../../lib/useDebounced'
import { useSidtitel } from '../../lib/useSidtitel'
import { Filter, KalltextGrupp, Resultatvy, Sokfalt, type SourceTextResponse, type SearchMode } from './SokDelar'

// Vilka grupper som expanderats, ihågkommet per normaliserad fråga över
// navigation inom sessionen (search.md: sökstate får vara tillfälligt).
const expansionsminne = new Map<string, Set<SearchType>>()
const hämtaExpansion = (nyckel: string): Set<SearchType> => new Set(expansionsminne.get(nyckel))

// Den delbara sökparametern; tom fråga och intet filter utelämnas ur URL:en.
const sökObjekt = (term: string, type: SearchType | undefined): SearchParams => ({
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
const härledResultat = (
  term: string,
  type: SearchType | undefined,
  expanderade: ReadonlySet<SearchType>,
  anteckningar: Record<string, Note>,
): Härlett => {
  let grupper: SearchGroup[] = []
  let fel = false
  try {
    grupper = sokIBiblioteket(term, sokindexet)
  } catch {
    fel = true
  }
  const filtrerade = type ? grupper.filter((grupp) => grupp.type === type) : grupper
  const synliga = synligaTraffar(filtrerade, expanderade)
  const notes = type ? [] : sokAnteckningar(term, anteckningar)
  const redaktionellaOchNoter =
    filtrerade.reduce((summa, grupp) => summa + grupp.traffar.length, 0) + notes.length
  return { synliga, notes, redaktionellaOchNoter, fel }
}

const beräknaLäge = (nyckel: string, fel: boolean): SearchMode =>
  nyckel.length < 2 ? 'tom' : fel ? 'fel' : 'klar'

const TOMT_KALLTEXTSVAR: SourceTextResponse = { books: [], hits: [] }

const kalltextAntalAv = (svar: SourceTextResponse | null): number =>
  (svar?.books.length ?? 0) + (svar?.hits.length ?? 0)

// Inga träffar alls (och verssöket är inte längre på väg): först då visas
// no-results, aldrig medan källtextträffar fortfarande laddas.
const ärHeltTomt = (redaktionellaOchNoter: number, kalltextAntal: number, laddar: boolean): boolean =>
  redaktionellaOchNoter === 0 && kalltextAntal === 0 && !laddar

// Lägger till en expanderad grupp och sparar det i sessionsminnet.
const nyExpansion = (
  föregående: ReadonlySet<SearchType>,
  nyckel: string,
  grupptyp: SearchType,
): Set<SearchType> => {
  const nästa = new Set(föregående).add(grupptyp)
  expansionsminne.set(nyckel, nästa)
  return nästa
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
  const [expanderade, setExpanderade] = useState<Set<SearchType>>(() => hämtaExpansion(nyckel))

  useEffect(() => {
    if (term !== q) onNavigera(sökObjekt(term, type))
  }, [term, q, type, onNavigera])

  useEffect(() => {
    setExpanderade(hämtaExpansion(normalisera(term)))
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
  const anteckningar = useAtlas().anteckningar

  // Verssöket (verkläsarens FTS) körs bara utan typfilter och för fråga ≥ 2
  // tecken; annars ett tomt svar utan nätanrop. Egen väg, egen laddning.
  const sökKalltext = nyckel.length >= 2 && type === undefined
  const kalltext = useAsync<SourceTextResponse>(
    () => (sökKalltext ? searchLibrary(term) : Promise.resolve(TOMT_KALLTEXTSVAR)),
    [term, sökKalltext],
  )

  const { synliga, notes, redaktionellaOchNoter, fel } = härledResultat(
    term,
    type,
    expanderade,
    anteckningar,
  )
  const kalltextAntal = kalltextAntalAv(kalltext.data)
  const antal = redaktionellaOchNoter + kalltextAntal
  const ingaTraffar = ärHeltTomt(redaktionellaOchNoter, kalltextAntal, kalltext.loading)

  // Fas 14: rapportera bara tekniskt minimum ur söket — ett index-fel eller en
  // helt tom sökning (anonymiserat). Anteckningssöket rör detta aldrig, och
  // frågans text loggas aldrig — bara längd och ordantal.
  useEffect(() => {
    if (nyckel.length < 2) return
    if (fel) rapportera({ type: 'sokfel', detalj: 'index' })
    else if (ingaTraffar) rapportera({ type: 'sok-nolltraff', ...anonymiseraFraga(term) })
  }, [nyckel, fel, ingaTraffar, term])

  return (
    <div className="screenSub">
      <TopBar />
      <Sokfalt query={query} onChange={ändraFråga} onSubmit={sökDirekt} />
      <Filter aktiv={type} antal={antal} onVal={(nyTyp) => onNavigera(sökObjekt(term, nyTyp))} />
      <Resultatvy
        läge={beräknaLäge(nyckel, fel)}
        ingaTraffar={ingaTraffar}
        synliga={synliga}
        kalltext={
          type === undefined ? (
            <KalltextGrupp key={nyckel} svar={kalltext.data} fel={kalltext.error} />
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
