import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { ReadMode } from '../content/model'
import { SEARCH_TYPES, type SearchType, type SearchParams } from '../lib/searchTypes'
import { HomePage } from '../pages/HomePage'
import { NotFoundNote } from '../pages/NotFoundNote'
import { RootLayout } from './RootLayout'

// Code splitting (phase 13): only the threshold (HomePage), the shell (RootLayout)
// and the small NotFoundNote are loaded in the startup bundle. The other pages —
// the library, the reading room, the work reader, search, the old pages — load as
// their own chunks when the route opens, so the home screen is spared the whole
// app's JavaScript at once. The chunks are precached by the service worker (workbox
// globPatterns), so they exist offline and usually open instantly. `defaultPreload:
// 'intent'` preloads them on hover/touch. The selector picks the named export with
// static access (m.X), so both the bundler and the dead-code analysis (fallow) can
// see which export is used.
const lazyPage = <Props extends object>(
  select: () => Promise<ComponentType<Props>>,
): LazyExoticComponent<ComponentType<Props>> => lazy(async () => ({ default: await select() }))

const TopicPage = lazyPage(() => import('../pages/TopicPage').then((m) => m.TopicPage))
const AtlasPage = lazyPage(() => import('../pages/AtlasPage').then((m) => m.AtlasPage))
const LibraryHomePage = lazyPage(() =>
  import('../pages/bibliotek/LibraryHomePage').then((m) => m.LibraryHomePage),
)
const QuestionPage = lazyPage(() => import('../pages/bibliotek/QuestionPage').then((m) => m.QuestionPage))
const QuestionListPage = lazyPage(() =>
  import('../pages/bibliotek/QuestionListPage').then((m) => m.QuestionListPage),
)
const SourcePostPage = lazyPage(() =>
  import('../pages/bibliotek/SourcePostPage').then((m) => m.SourcePostPage),
)
const PersonPostPage = lazyPage(() =>
  import('../pages/bibliotek/PersonPostPage').then((m) => m.PersonPostPage),
)
const RoomListPage = lazyPage(() => import('../pages/bibliotek/RoomListPage').then((m) => m.RoomListPage))
const ThemePage = lazyPage(() => import('../pages/bibliotek/ThemePage').then((m) => m.ThemePage))
const PathPage = lazyPage(() => import('../pages/vandringar/PathPage').then((m) => m.PathPage))
const PathListPage = lazyPage(() =>
  import('../pages/vandringar/PathListPage').then((m) => m.PathListPage),
)
const PathReadPage = lazyPage(() =>
  import('../pages/vandringar/PathReadPage').then((m) => m.PathReadPage),
)
const SearchLibraryPage = lazyPage(() =>
  import('../pages/bibliotek/SearchLibraryPage').then((m) => m.SearchLibraryPage),
)
const LibrarySearchPage = lazyPage(() =>
  import('../pages/library/LibrarySearchPage').then((m) => m.LibrarySearchPage),
)
const BookPage = lazyPage(() => import('../pages/library/BookPage').then((m) => m.BookPage))
const ChapterPage = lazyPage(() => import('../pages/library/ChapterPage').then((m) => m.ChapterPage))
const WorkListPage = lazyPage(() => import('../pages/library/WorkListPage').then((m) => m.WorkListPage))
const WorkPage = lazyPage(() => import('../pages/library/WorkPage').then((m) => m.WorkPage))
const SettingsPage = lazyPage(() =>
  import('../pages/SettingsPage').then((m) => m.SettingsPage),
)
const SourcePage = lazyPage(() => import('../pages/SourcePage').then((m) => m.SourcePage))
const ReadPage = lazyPage(() => import('../pages/ReadPage').then((m) => m.ReadPage))
const PersonPage = lazyPage(() => import('../pages/PersonPage').then((m) => m.PersonPage))
const PeoplePage = lazyPage(() => import('../pages/PeoplePage').then((m) => m.PeoplePage))
const CollectionPage = lazyPage(() => import('../pages/CollectionPage').then((m) => m.CollectionPage))
const SearchPage = lazyPage(() => import('../pages/SearchPage').then((m) => m.SearchPage))
const TimelinePage = lazyPage(() => import('../pages/TimelinePage').then((m) => m.TimelinePage))
const ExplorePage = lazyPage(() => import('../pages/ExplorePage').then((m) => m.ExplorePage))
const RoomPage = lazyPage(() => import('../pages/RoomPage').then((m) => m.RoomPage))

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <NotFoundNote />,
})

const hemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const utforskaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/utforska',
  component: ExplorePage,
})

const amneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/amne/$id',
  component: function AmneRoute() {
    return <TopicPage id={amneRoute.useParams().id} />
  },
})

const readRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/las/$id/$mode',
  component: function LasRoute() {
    const params = readRoute.useParams()
    const mode: ReadMode = params.mode === 'kontext' ? 'kontext' : 'essa'
    return <ReadPage id={params.id} mode={mode} />
  },
})

const sourceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/kalla/$id',
  component: function KallaRoute() {
    return <SourcePage id={sourceRoute.useParams().id} />
  },
})

const tidslinjeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tidslinje',
  component: TimelinePage,
})

const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/personer',
  component: PeoplePage,
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
  component: CollectionPage,
})

const installningarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/installningar',
  component: SettingsPage,
})

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sok',
  component: SearchPage,
})

// The library's landing (the remake, phase 6): questions, themes, rooms, sources.
const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek',
  component: LibraryHomePage,
})

const questionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/fraga/$slug',
  component: function FragaRoute() {
    return <QuestionPage slug={questionRoute.useParams().slug} />
  },
})

const themeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/tema/$slug',
  component: function TemaRoute() {
    return <ThemePage slug={themeRoute.useParams().slug} />
  },
})

const roomListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/rum',
  component: RoomListPage,
})

const fragelistaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/fragor',
  component: QuestionListPage,
})

const sourceItemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/kalla/$slug',
  component: function KallaPostRoute() {
    return <SourcePostPage slug={sourceItemRoute.useParams().slug} />
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

// The paths are their own section beside the library (editor's decision
// 2026-07-28): the anteroom (overview), the list and the reading flow live
// under /vandring…, not /bibliotek/….
const pathRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/vandring/$slug',
  component: function VandringRoute() {
    return <PathPage slug={pathRoute.useParams().slug} />
  },
})

// The path's own reading surface — the whole walk as one slow, continuous
// reading. The static segment `las` can't collide with a path slug.
const pathReadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/vandring/$slug/las',
  component: function VandringLasRoute() {
    return <PathReadPage slug={pathReadRoute.useParams().slug} />
  },
})

// All published paths — the reachable list behind the »Vandringar« nav tab.
// A static segment (`vandringar`) that can't collide with `/vandring/$slug`.
const vandringListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/vandringar',
  component: PathListPage,
})

// The old library addresses forward, so testers' bookmarks survive the move.
const legacyPathRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/vandring/$slug',
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/vandring/$slug', params, replace: true })
  },
})

const legacyPathListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/vandringar',
  beforeLoad: () => {
    throw redirect({ to: '/vandringar', replace: true })
  },
})

// The work reader lives under the static segment `verk`, so the landing's
// subpages can never be shadowed by a work's id.
const verklistaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/verk',
  component: WorkListPage,
})

const workRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/verk/$workId',
  component: function VerkRoute() {
    // key ⇒ the component remounts per work, so the filter field doesn't linger
    // when switching to another work (TanStack would otherwise reuse the instance).
    const { workId } = workRoute.useParams()
    return <WorkPage key={workId} workId={workId} />
  },
})

const bookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/verk/$workId/$bookSlug',
  component: function BokRoute() {
    const params = bookRoute.useParams()
    return <BookPage workId={params.workId} bookSlug={params.bookSlug} />
  },
})

const chapterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/kapitel/$workId/$bookSlug/$chapter',
  component: function KapitelRoute() {
    const params = chapterRoute.useParams()
    return (
      <ChapterPage
        workId={params.workId}
        bookSlug={params.bookSlug}
        chapter={params.chapter}
      />
    )
  },
})

// The reading room (the remake, phase 3): rooms from the editorial content.
// Always standalone — a path is read in its own flow (/vandring/$slug/las),
// never room by room here (paths.md, Relationship to the Library).
const roomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rum/$slug',
  component: function RumRoute() {
    return <RoomPage slug={roomRoute.useParams().slug} />
  },
})

const librarySearchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek-sok',
  component: LibrarySearchPage,
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
      <SearchLibraryPage
        q={search.q ?? ''}
        type={search.type}
        onNavigera={(search) => navigate({ search: search, replace: true })}
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
  pathReadRoute,
  vandringListRoute,
  legacyPathRoute,
  legacyPathListRoute,
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
  // Soft page change on every Link/navigate: document.startViewTransition with
  // the app's --motion crossfade (global.css). Browsers without support fall
  // back to an immediate swap; screen containers still carry vaFade there.
  // Callers that navigate after a lazy import (Home → room) should preloadRoute
  // first so the crossfade lands on the page, not the Suspense ··· state.
  defaultViewTransition: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
