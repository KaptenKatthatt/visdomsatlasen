import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import type { ReadMode } from '../content/model'
import { AmnePage } from '../pages/AmnePage'
import { AtlasPage } from '../pages/AtlasPage'
import { BibliotekPage } from '../pages/library/BibliotekPage'
import { BibliotekSokPage } from '../pages/library/BibliotekSokPage'
import { BokPage } from '../pages/library/BokPage'
import { KapitelPage } from '../pages/library/KapitelPage'
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

const bibliotekRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek',
  component: BibliotekPage,
})

const verkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/$workId',
  component: function VerkRoute() {
    // key ⇒ komponenten monteras om per verk, så filterfältet inte hänger kvar
    // när man byter till ett annat verk (TanStack återanvänder annars instansen).
    const { workId } = verkRoute.useParams()
    return <VerkPage key={workId} workId={workId} />
  },
})

const bokRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek/$workId/$bookSlug',
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
const rumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rum/$slug',
  component: function RumRoute() {
    return <RumPage slug={rumRoute.useParams().slug} />
  },
})

const bibliotekSokRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bibliotek-sok',
  component: BibliotekSokPage,
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
  verkRoute,
  bokRoute,
  kapitelRoute,
  bibliotekSokRoute,
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
