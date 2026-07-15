// Bibliotekssökets sida (search.md): ett debouncat fält, URL-buret sökstate,
// grupperade ändliga resultat och en separat privat anteckningsgrupp. Söket bor
// i Biblioteket och tar aldrig plats i läsrummet. Ingen popularitetssignal.
import { useEffect, useState } from 'react'
import { TopBar } from '../../components/TopBar'
import { searchLibrary } from '../../lib/api'
import type { Anteckning } from '../../lib/personligt'
import { sokAnteckningar } from '../../lib/sokanteckningar'
import { sokindexet, type Soktyp, type SökParametrar } from '../../lib/sokindex'
import { sokIBiblioteket, synligaTraffar, type Sokgrupp, type SynligGrupp } from '../../lib/soklogik'
import { normalisera } from '../../lib/soknormalisering'
import { useAsync } from '../../lib/useAsync'
import { useAtlas } from '../../lib/store'
import { useDebounced } from '../../lib/useDebounced'
import { useSidtitel } from '../../lib/useSidtitel'
import { Filter, KalltextGrupp, Resultatvy, Sokfalt, type Kalltextsvar, type Sokläge } from './SokDelar'

// Vilka grupper som expanderats, ihågkommet per normaliserad fråga över
// navigation inom sessionen (search.md: sökstate får vara tillfälligt).
const expansionsminne = new Map<string, Set<Soktyp>>()
const hämtaExpansion = (nyckel: string): Set<Soktyp> => new Set(expansionsminne.get(nyckel))

// Den delbara sökparametern; tom fråga och intet filter utelämnas ur URL:en.
const sökObjekt = (term: string, typ: Soktyp | undefined): SökParametrar => ({
  ...(term ? { q: term } : {}),
  ...(typ ? { typ } : {}),
})

type Härlett = {
  synliga: SynligGrupp[]
  noteringar: Anteckning[]
  redaktionellaOchNoter: number
  fel: boolean
}

// Härleder de redaktionella resultaten och den privata anteckningsgruppen ur
// termen. Ren funktion (utanför komponenten) så sidan hålls liten och läsbar.
const härledResultat = (
  term: string,
  typ: Soktyp | undefined,
  expanderade: ReadonlySet<Soktyp>,
  anteckningar: Record<string, Anteckning>,
): Härlett => {
  let grupper: Sokgrupp[] = []
  let fel = false
  try {
    grupper = sokIBiblioteket(term, sokindexet)
  } catch {
    fel = true
  }
  const filtrerade = typ ? grupper.filter((grupp) => grupp.typ === typ) : grupper
  const synliga = synligaTraffar(filtrerade, expanderade)
  const noteringar = typ ? [] : sokAnteckningar(term, anteckningar)
  const redaktionellaOchNoter =
    filtrerade.reduce((summa, grupp) => summa + grupp.traffar.length, 0) + noteringar.length
  return { synliga, noteringar, redaktionellaOchNoter, fel }
}

const beräknaLäge = (nyckel: string, fel: boolean): Sokläge =>
  nyckel.length < 2 ? 'tom' : fel ? 'fel' : 'klar'

const TOMT_KALLTEXTSVAR: Kalltextsvar = { books: [], hits: [] }

const kalltextAntalAv = (svar: Kalltextsvar | null): number =>
  (svar?.books.length ?? 0) + (svar?.hits.length ?? 0)

// Inga träffar alls (och verssöket är inte längre på väg): först då visas
// no-results, aldrig medan källtextträffar fortfarande laddas.
const ärHeltTomt = (redaktionellaOchNoter: number, kalltextAntal: number, laddar: boolean): boolean =>
  redaktionellaOchNoter === 0 && kalltextAntal === 0 && !laddar

// Lägger till en expanderad grupp och sparar det i sessionsminnet.
const nyExpansion = (
  föregående: ReadonlySet<Soktyp>,
  nyckel: string,
  grupptyp: Soktyp,
): Set<Soktyp> => {
  const nästa = new Set(föregående).add(grupptyp)
  expansionsminne.set(nyckel, nästa)
  return nästa
}

// Sökfältets tillstånd: debouncat värde, Enter söker direkt, termen speglas i
// URL:en och expanderade grupper minns per fråga. Samlat i en hook så själva
// sidan blir liten och läsbar.
const useSoktillstand = (
  q: string,
  typ: Soktyp | undefined,
  onNavigera: (sök: SökParametrar) => void,
) => {
  const [query, setQuery] = useState(q)
  const [direkt, setDirekt] = useState<string | null>(null)
  const debounced = useDebounced(query.trim(), 250)
  const term = direkt ?? debounced
  const nyckel = normalisera(term)
  const [expanderade, setExpanderade] = useState<Set<Soktyp>>(() => hämtaExpansion(nyckel))

  useEffect(() => {
    if (term !== q) onNavigera(sökObjekt(term, typ))
  }, [term, q, typ, onNavigera])

  useEffect(() => {
    setExpanderade(hämtaExpansion(normalisera(term)))
  }, [term])

  return {
    query,
    term,
    nyckel,
    expanderade,
    visaFler: (grupptyp: Soktyp) => setExpanderade((prev) => nyExpansion(prev, nyckel, grupptyp)),
    ändraFråga: (värde: string) => {
      setQuery(värde)
      setDirekt(null)
    },
    sökDirekt: () => setDirekt(query.trim()),
  }
}

type Props = {
  q: string
  typ: Soktyp | undefined
  onNavigera: (sök: SökParametrar) => void
}

export const SokBibliotekPage = ({ q, typ, onNavigera }: Props) => {
  useSidtitel('Sök i Biblioteket')
  const { query, term, nyckel, expanderade, visaFler, ändraFråga, sökDirekt } = useSoktillstand(
    q,
    typ,
    onNavigera,
  )
  const anteckningar = useAtlas().anteckningar

  // Verssöket (verkläsarens FTS) körs bara utan typfilter och för fråga ≥ 2
  // tecken; annars ett tomt svar utan nätanrop. Egen väg, egen laddning.
  const sökKalltext = nyckel.length >= 2 && typ === undefined
  const kalltext = useAsync<Kalltextsvar>(
    () => (sökKalltext ? searchLibrary(term) : Promise.resolve(TOMT_KALLTEXTSVAR)),
    [term, sökKalltext],
  )

  const { synliga, noteringar, redaktionellaOchNoter, fel } = härledResultat(
    term,
    typ,
    expanderade,
    anteckningar,
  )
  const kalltextAntal = kalltextAntalAv(kalltext.data)
  const antal = redaktionellaOchNoter + kalltextAntal
  const ingaTraffar = ärHeltTomt(redaktionellaOchNoter, kalltextAntal, kalltext.loading)

  return (
    <div className="screenSub">
      <TopBar />
      <Sokfalt query={query} onChange={ändraFråga} onSubmit={sökDirekt} />
      <Filter aktiv={typ} antal={antal} onVal={(nyTyp) => onNavigera(sökObjekt(term, nyTyp))} />
      <Resultatvy
        läge={beräknaLäge(nyckel, fel)}
        ingaTraffar={ingaTraffar}
        synliga={synliga}
        kalltext={
          typ === undefined ? (
            <KalltextGrupp key={nyckel} svar={kalltext.data} fel={kalltext.error} />
          ) : null
        }
        noteringar={noteringar}
        nyckel={nyckel}
        antal={antal}
        onVisaFler={visaFler}
      />
    </div>
  )
}
