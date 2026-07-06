import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import type { ReadMode } from '../content/model'
import { AmnePage } from '../pages/AmnePage'
import { AtlasPage } from '../pages/AtlasPage'
import { HemPage } from '../pages/HemPage'
import { KallaPage } from '../pages/KallaPage'
import { LasPage } from '../pages/LasPage'
import { NotFoundNote } from '../pages/NotFoundNote'
import { PersonPage } from '../pages/PersonPage'
import { PersonerPage } from '../pages/PersonerPage'
import { SamlingPage } from '../pages/SamlingPage'
import { SokPage } from '../pages/SokPage'
import { TidslinjePage } from '../pages/TidslinjePage'
import { UtforskaPage } from '../pages/UtforskaPage'
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

const sokRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sok',
  component: SokPage,
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
  sokRoute,
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
