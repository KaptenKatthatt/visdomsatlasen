import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import type { ReadMode } from '../content/model'
import { AmnePage } from '../pages/AmnePage'
import { AtlasPage } from '../pages/AtlasPage'
import { BibliotekHemPage } from '../pages/bibliotek/BibliotekHemPage'
import { FragaPage } from '../pages/bibliotek/FragaPage'
import { FragelistaPage } from '../pages/bibliotek/FragelistaPage'
import { KallaPostPage } from '../pages/bibliotek/KallaPostPage'
import { RumlistaPage } from '../pages/bibliotek/RumlistaPage'
import { TemaPage } from '../pages/bibliotek/TemaPage'
import { VandringPage } from '../pages/bibliotek/VandringPage'
import { SokBibliotekPage } from '../pages/bibliotek/SokBibliotekPage'
import { BibliotekSokPage } from '../pages/library/BibliotekSokPage'
import { SOKTYPER, type Soktyp, type SökParametrar } from '../lib/sokindex'
import { BokPage } from '../pages/library/BokPage'
import { KapitelPage } from '../pages/library/KapitelPage'
import { VerklistaPage } from '../pages/library/VerklistaPage'
import { VerkPage } from '../pages/library/VerkPage'
import { HemPage } from '../pages/HemPage'
import { InstallningarPage } from '../pages/InstallningarPage'
import { KallaPage } from '../pages/KallaPage'
import { LasPage } from '../pages/LasPage'
import { NotFoundNote } from '../pages/NotFoundNote'
import { PersonPage } from '../pages/PersonPage'
import { PersonerPage } from '../pages/PersonerPage'
import { SamlingPage } from '../pages/SamlingPage'
import { SokPage } from '../pages/SokPage'
import { TidslinjePage } from '../pages/TidslinjePage'
import { UtforskaPage } from '../pages/UtforskaPage'
import { RumPage } from '../pages/RumPage'
import { RootLayout } from './RootLayout'

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <NotFoundNote />,
})

const hemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HemPage,
})

const utforskaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/utforska',
  component: UtforskaPage,
})

const amneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/amne/$id',
  component: function AmneRoute() {
    return <AmnePage id={amneRoute.useParams().id} />
  },
})

const lasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/las/$id/$mode',
  component: function LasRoute() {
    const params = lasRoute.useParams()
    const mode: ReadMode = params.mode === 'kontext' ? 'kontext' : 'essa'
    return <LasPage id={params.id} mode={mode} />
  },
})

const kallaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/kalla/$id',
  component: function KallaRoute() {
    return <KallaPage id={kallaRoute.useParams().id} />
  },
})

const tidslinjeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tidslinje',
  component: TidslinjePage,
})

const personerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/personer',
  component: PersonerPage,
})

const personRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/person/$id',
  component: function PersonRoute() {
    return <PersonPage id={personRoute.useParams().id} />
  },
})

const atlasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/atlas',
  component: AtlasPage,
})

const samlingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/samling',
  component: SamlingPage,
})

const installningarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/installningar',
  component: InstallningarPage,
})

const sokRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sok',
  component: SokPage,
})

// Bibliotekets landning (omgörningen, fas 6): frågor, teman, rum, källor.
const bibliotekRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek',
  component: BibliotekHemPage,
})

const fragaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/fraga/$slug',
  component: function FragaRoute() {
    return <FragaPage slug={fragaRoute.useParams().slug} />
  },
})

const temaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/tema/$slug',
  component: function TemaRoute() {
    return <TemaPage slug={temaRoute.useParams().slug} />
  },
})

const rumlistaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/rum',
  component: RumlistaPage,
})

const fragelistaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/fragor',
  component: FragelistaPage,
})

const kallaPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/kalla/$slug',
  component: function KallaPostRoute() {
    return <KallaPostPage slug={kallaPostRoute.useParams().slug} />
  },
})

const vandringRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/vandring/$slug',
  component: function VandringRoute() {
    return <VandringPage slug={vandringRoute.useParams().slug} />
  },
})

// Verkläsaren bor under det statiska segmentet `verk`, så landningens
// undersidor aldrig kan skuggas av ett verks id.
const verklistaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/verk',
  component: VerklistaPage,
})

const verkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/verk/$workId',
  component: function VerkRoute() {
    // key ⇒ komponenten monteras om per verk, så filterfältet inte hänger kvar
    // när man byter till ett annat verk (TanStack återanvänder annars instansen).
    const { workId } = verkRoute.useParams()
    return <VerkPage key={workId} workId={workId} />
  },
})

const bokRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/verk/$workId/$bookSlug',
  component: function BokRoute() {
    const params = bokRoute.useParams()
    return <BokPage workId={params.workId} bookSlug={params.bookSlug} />
  },
})

const kapitelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/kapitel/$workId/$bookSlug/$chapter',
  component: function KapitelRoute() {
    const params = kapitelRoute.useParams()
    return (
      <KapitelPage
        workId={params.workId}
        bookSlug={params.bookSlug}
        chapter={params.chapter}
      />
    )
  },
})

// Läsrummet (omgörningen, fas 3): rum ur det redaktionella innehållet.
// Sökparametern `vandring` bär den enda vandringskontexten — utan den läses
// rummet fristående, utan vandrings-UI (paths.md, Relationship to the Library).
const rumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rum/$slug',
  validateSearch: (search: Record<string, unknown>): { vandring?: string } =>
    typeof search['vandring'] === 'string' ? { vandring: search['vandring'] } : {},
  component: function RumRoute() {
    return <RumPage slug={rumRoute.useParams().slug} vandringSlug={rumRoute.useSearch().vandring} />
  },
})

const bibliotekSokRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek-sok',
  component: BibliotekSokPage,
})

// Bibliotekssöket (fas 10, search.md): frågan och det valfria typfiltret bärs i
// URL:en (?q=…&typ=…), så sökstate överlever navigation, refresh och delning.
// Privata anteckningsträffar hamnar aldrig i URL:en.
const ärSoktyp = (värde: unknown): värde is Soktyp =>
  typeof värde === 'string' && (SOKTYPER as readonly string[]).includes(värde)

const sokBibliotekRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/sok',
  validateSearch: (search: Record<string, unknown>): SökParametrar => ({
    ...(typeof search['q'] === 'string' && search['q'] !== '' ? { q: search['q'] } : {}),
    ...(ärSoktyp(search['typ']) ? { typ: search['typ'] } : {}),
  }),
  component: function SokBibliotekRoute() {
    const search = sokBibliotekRoute.useSearch()
    const navigate = sokBibliotekRoute.useNavigate()
    return (
      <SokBibliotekPage
        q={search.q ?? ''}
        typ={search.typ}
        onNavigera={(sök) => navigate({ search: sök, replace: true })}
      />
    )
  },
})

const routeTree = rootRoute.addChildren([
  hemRoute,
  utforskaRoute,
  amneRoute,
  lasRoute,
  kallaRoute,
  tidslinjeRoute,
  personerRoute,
  personRoute,
  atlasRoute,
  samlingRoute,
  installningarRoute,
  sokRoute,
  bibliotekRoute,
  fragaRoute,
  temaRoute,
  rumlistaRoute,
  fragelistaRoute,
  kallaPostRoute,
  vandringRoute,
  verklistaRoute,
  verkRoute,
  bokRoute,
  kapitelRoute,
  bibliotekSokRoute,
  sokBibliotekRoute,
  rumRoute,
])

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
