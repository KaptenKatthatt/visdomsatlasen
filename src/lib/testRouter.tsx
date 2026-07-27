import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

/** A minimal memory router around a page under test. The page's links point at
 * real routes, so they need somewhere to resolve — but only the targets the page
 * links to are declared, as empty components: what is under test is the page, not
 * the routing.
 *
 * `paths` are the route patterns the page links to (e.g. `/rum/$slug`); the page
 * itself is mounted at `/`. `wrapper` takes providers the page needs — the store,
 * say — so the router still sits inside them. Resolves once the page's `<h1>` is
 * on screen, so callers never have to await the first render themselves. */
export const renderWithRouter = async ({
  page,
  paths,
  wrapper = (children) => children,
}: {
  page: () => ReactElement | null
  paths: string[]
  wrapper?: (children: ReactNode) => ReactNode
}): Promise<void> => {
  const rootRoute = createRootRoute()
  const routes = [
    createRoute({ getParentRoute: () => rootRoute, path: '/', component: page }),
    ...paths.map((path) =>
      createRoute({ getParentRoute: () => rootRoute, path, component: () => null }),
    ),
  ]
  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  render(<>{wrapper(<RouterProvider router={router} />)}</>)
  await screen.findByRole('heading', { level: 1 })
}
