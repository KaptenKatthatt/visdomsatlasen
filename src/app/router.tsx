import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ReadMode } from '../content/model'
import { SOKTYPER, type SearchType, type SearchParams } from '../lib/soktyper'
import { HemPage } from '../pages/HemPage'
import { NotFoundNote } from '../pages/NotFoundNote'
import { RootLayout } from './RootLayout'

// Kod-delning (fas 13): bara tröskeln (HemPage), skalet (RootLayout) och den
// lilla NotFoundNote laddas i startbunten. Övriga sidor — biblioteket, läsrummet,
// verkläsaren, söket, de gamla sidorna — laddas som egna chunkar när routen
// öppnas, så hemskärmen slipper hela appens JavaScript på en gång. Chunkarna
// precachas av service-workern (workbox globPatterns), så de finns offline och
// öppnas oftast direkt. `defaultPreload: 'intent'` förladdar dem vid hovring/touch.
// Selektorn plockar den namngivna exporten med statisk åtkomst (m.X), så både
// bundlaren och dead-code-analysen (fallow) ser vilken export som används.
const lazyPage = <Props extends object>(
  valj: () => Promise<ComponentType<Props>>,
): LazyExoticComponent<ComponentType<Props>> => lazy(async () => ({ default: await valj() }))

const AmnePage = lazyPage(() => import('../pages/AmnePage').then((m) => m.AmnePage))
const AtlasPage = lazyPage(() => import('../pages/AtlasPage').then((m) => m.AtlasPage))
const BibliotekHemPage = lazyPage(() =>
  import('../pages/bibliotek/BibliotekHemPage').then((m) => m.BibliotekHemPage),
)
const FragaPage = lazyPage(() => import('../pages/bibliotek/FragaPage').then((m) => m.FragaPage))
const FragelistaPage = lazyPage(() =>
  import('../pages/bibliotek/FragelistaPage').then((m) => m.FragelistaPage),
)
const KallaPostPage = lazyPage(() =>
  import('../pages/bibliotek/KallaPostPage').then((m) => m.KallaPostPage),
)
const RumlistaPage = lazyPage(() => import('../pages/bibliotek/RumlistaPage').then((m) => m.RumlistaPage))
const TemaPage = lazyPage(() => import('../pages/bibliotek/TemaPage').then((m) => m.TemaPage))
const VandringPage = lazyPage(() => import('../pages/bibliotek/VandringPage').then((m) => m.VandringPage))
const SokBibliotekPage = lazyPage(() =>
  import('../pages/bibliotek/SokBibliotekPage').then((m) => m.SokBibliotekPage),
)
const BibliotekSokPage = lazyPage(() =>
  import('../pages/library/BibliotekSokPage').then((m) => m.BibliotekSokPage),
)
const BokPage = lazyPage(() => import('../pages/library/BokPage').then((m) => m.BokPage))
const KapitelPage = lazyPage(() => import('../pages/library/KapitelPage').then((m) => m.KapitelPage))
const VerklistaPage = lazyPage(() => import('../pages/library/VerklistaPage').then((m) => m.VerklistaPage))
const VerkPage = lazyPage(() => import('../pages/library/VerkPage').then((m) => m.VerkPage))
const InstallningarPage = lazyPage(() =>
  import('../pages/InstallningarPage').then((m) => m.InstallningarPage),
)
const KallaPage = lazyPage(() => import('../pages/KallaPage').then((m) => m.KallaPage))
const LasPage = lazyPage(() => import('../pages/LasPage').then((m) => m.LasPage))
const PersonPage = lazyPage(() => import('../pages/PersonPage').then((m) => m.PersonPage))
const PersonerPage = lazyPage(() => import('../pages/PersonerPage').then((m) => m.PersonerPage))
const SamlingPage = lazyPage(() => import('../pages/SamlingPage').then((m) => m.SamlingPage))
const SokPage = lazyPage(() => import('../pages/SokPage').then((m) => m.SokPage))
const TidslinjePage = lazyPage(() => import('../pages/TidslinjePage').then((m) => m.TidslinjePage))
const UtforskaPage = lazyPage(() => import('../pages/UtforskaPage').then((m) => m.UtforskaPage))
const RumPage = lazyPage(() => import('../pages/RumPage').then((m) => m.RumPage))

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

// Bibliotekets landning (omgörningen, fas 6): frågor, themes, rum, sources.
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
// URL:en (?q=…&type=…), så sökstate överlever navigation, refresh och delning.
// Privata anteckningsträffar hamnar aldrig i URL:en.
const ärSoktyp = (värde: unknown): värde is SearchType =>
  typeof värde === 'string' && (SOKTYPER as readonly string[]).includes(värde)

const sokBibliotekRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/sok',
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    ...(typeof search['q'] === 'string' && search['q'] !== '' ? { q: search['q'] } : {}),
    ...(ärSoktyp(search['type']) ? { type: search['type'] } : {}),
  }),
  component: function SokBibliotekRoute() {
    const search = sokBibliotekRoute.useSearch()
    const navigate = sokBibliotekRoute.useNavigate()
    return (
      <SokBibliotekPage
        q={search.q ?? ''}
        type={search.type}
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
  // Förladda en routes chunk redan vid hovring/touch-intention, så navigeringen
  // känns omedelbar trots kod-delningen (fas 13).
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
