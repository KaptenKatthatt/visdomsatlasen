import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ReadMode } from '../content/model'
import { SEARCH_TYPES, type SearchType, type SearchParams } from '../lib/searchTypes'
import { HemPage } from '../pages/HemPage'
import { NotFoundNote } from '../pages/NotFoundNote'
import { RootLayout } from './RootLayout'

// Code splitting (phase 13): only the threshold (HemPage), the shell (RootLayout)
// and the small NotFoundNote are loaded in the startup bundle. The other pages —
// the library, the reading room, the work reader, search, the old pages — load as
// their own chunks when the route opens, so the home screen is spared the whole
// app's JavaScript at once. The chunks are precached by the service worker (workbox
// globPatterns), so they exist offline and usually open instantly. `defaultPreload:
// 'intent'` preloads them on hover/touch. The selector picks the named export with
// static access (m.X), so both the bundler and the dead-code analysis (fallow) can
// see which export is used.
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
const PersonPostPage = lazyPage(() =>
  import('../pages/bibliotek/PersonPostPage').then((m) => m.PersonPostPage),
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

const readRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/las/$id/$mode',
  component: function LasRoute() {
    const params = readRoute.useParams()
    const mode: ReadMode = params.mode === 'kontext' ? 'kontext' : 'essa'
    return <LasPage id={params.id} mode={mode} />
  },
})

const sourceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/kalla/$id',
  component: function KallaRoute() {
    return <KallaPage id={sourceRoute.useParams().id} />
  },
})

const tidslinjeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tidslinje',
  component: TidslinjePage,
})

const peopleRoute = createRoute({
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

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sok',
  component: SokPage,
})

// The library's landing (the remake, phase 6): questions, themes, rooms, sources.
const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek',
  component: BibliotekHemPage,
})

const questionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/fraga/$slug',
  component: function FragaRoute() {
    return <FragaPage slug={questionRoute.useParams().slug} />
  },
})

const themeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/tema/$slug',
  component: function TemaRoute() {
    return <TemaPage slug={themeRoute.useParams().slug} />
  },
})

const roomListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/rum',
  component: RumlistaPage,
})

const fragelistaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/fragor',
  component: FragelistaPage,
})

const sourceItemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/kalla/$slug',
  component: function KallaPostRoute() {
    return <KallaPostPage slug={sourceItemRoute.useParams().slug} />
  },
})

// The library's person pages (the new model) — distinct from legacy /person/$id.
const personPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/person/$slug',
  component: function PersonPostRoute() {
    return <PersonPostPage slug={personPostRoute.useParams().slug} />
  },
})

const pathRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/vandring/$slug',
  component: function VandringRoute() {
    return <VandringPage slug={pathRoute.useParams().slug} />
  },
})

// The work reader lives under the static segment `verk`, so the landing's
// subpages can never be shadowed by a work's id.
const verklistaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/verk',
  component: VerklistaPage,
})

const workRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/verk/$workId',
  component: function VerkRoute() {
    // key ⇒ the component remounts per work, so the filter field doesn't linger
    // when switching to another work (TanStack would otherwise reuse the instance).
    const { workId } = workRoute.useParams()
    return <VerkPage key={workId} workId={workId} />
  },
})

const bookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/verk/$workId/$bookSlug',
  component: function BokRoute() {
    const params = bookRoute.useParams()
    return <BokPage workId={params.workId} bookSlug={params.bookSlug} />
  },
})

const chapterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/kapitel/$workId/$bookSlug/$chapter',
  component: function KapitelRoute() {
    const params = chapterRoute.useParams()
    return (
      <KapitelPage
        workId={params.workId}
        bookSlug={params.bookSlug}
        chapter={params.chapter}
      />
    )
  },
})

// The reading room (the remake, phase 3): rooms from the editorial content.
// The `vandring` search param carries the only path context — without it the room
// is read standalone, without path UI (paths.md, Relationship to the Library).
const roomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rum/$slug',
  validateSearch: (search: Record<string, unknown>): { vandring?: string } =>
    typeof search['vandring'] === 'string' ? { vandring: search['vandring'] } : {},
  component: function RumRoute() {
    return <RumPage slug={roomRoute.useParams().slug} vandringSlug={roomRoute.useSearch().vandring} />
  },
})

const librarySearchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek-sok',
  component: BibliotekSokPage,
})

// The library search (phase 10, search.md): the query and the optional type filter
// are carried in the URL (?q=…&type=…), so search state survives navigation, refresh
// and sharing. Private note matches never end up in the URL.
const isSearchType = (value: unknown): value is SearchType =>
  typeof value === 'string' && (SEARCH_TYPES as readonly string[]).includes(value)

const searchLibraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/sok',
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    ...(typeof search['q'] === 'string' && search['q'] !== '' ? { q: search['q'] } : {}),
    ...(isSearchType(search['type']) ? { type: search['type'] } : {}),
  }),
  component: function SokBibliotekRoute() {
    const search = searchLibraryRoute.useSearch()
    const navigate = searchLibraryRoute.useNavigate()
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
  readRoute,
  sourceRoute,
  tidslinjeRoute,
  peopleRoute,
  personRoute,
  atlasRoute,
  samlingRoute,
  installningarRoute,
  searchRoute,
  libraryRoute,
  questionRoute,
  themeRoute,
  roomListRoute,
  fragelistaRoute,
  sourceItemRoute,
  personPostRoute,
  pathRoute,
  verklistaRoute,
  workRoute,
  bookRoute,
  chapterRoute,
  librarySearchRoute,
  searchLibraryRoute,
  roomRoute,
])

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  // Preload a route's chunk already on hover/touch intent, so navigation feels
  // instant despite the code splitting (phase 13).
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
