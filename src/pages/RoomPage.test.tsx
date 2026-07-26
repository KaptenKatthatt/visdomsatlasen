// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { cleanup, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { allPaths, allRooms } from '../lib/content'
import { roomsForPath } from '../lib/library'
import { AtlasProvider } from '../lib/store'
import { RoomPage } from './RoomPage'

// jsdom saknar matchMedia; storen frågar efter systemets mörka läge vid montering.
// Foten bryr sig inte om temat, så en stum ljus-svarare räcker.
window.matchMedia = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const PATH_SLUG = 'vagen-mot-lugn'

const path = allPaths.find((candidate) => candidate.slug === PATH_SLUG)
if (path === undefined) throw new Error(`Vandringen ${PATH_SLUG} saknas`)
const stops = roomsForPath(path, allRooms)

/** A minimal memory router around the reading room: the footer's links point at
 * real routes, so they need somewhere to resolve. The walk is what's under test,
 * not the routing. */
const renderRoom = async (slug: string, pathSlug?: string): Promise<void> => {
  const rootRoute = createRootRoute()
  const routes = [
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => <RoomPage slug={slug} pathSlug={pathSlug} />,
    }),
    createRoute({ getParentRoute: () => rootRoute, path: '/rum/$slug', component: () => null }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/bibliotek/kalla/$slug',
      component: () => null,
    }),
  ]
  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  render(
    <AtlasProvider>
      <RouterProvider router={router} />
    </AtlasProvider>,
  )
  await screen.findByRole('heading', { level: 1 })
}

// The footer is the only list in the reading room, so it is unambiguous here.
const trail = (): HTMLElement[] => [...screen.getByRole('list').querySelectorAll('li')]

describe('RoomPage utan vandring', () => {
  it('visar ingen vandringsfot när rummet läses fristående', async () => {
    const room = stops[0]
    expect(room).toBeDefined()
    if (room === undefined) return
    await renderRoom(room.slug)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

describe('RoomPage vandringsfot', () => {
  it('visar bara nästa anhalt i första rummet', async () => {
    const [first, second] = stops
    expect(first && second).toBeTruthy()
    if (first === undefined || second === undefined) return
    await renderRoom(first.slug, PATH_SLUG)
    const rows = trail()
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent(first.title)
    expect(rows[1]).toHaveTextContent(second.title)
  })

  it('visar föregående och nästa anhalt i ett rum mitt på leden', async () => {
    const [first, second, third] = stops
    expect(first && second && third).toBeTruthy()
    if (first === undefined || second === undefined || third === undefined) return
    await renderRoom(second.slug, PATH_SLUG)
    expect(trail().map((row) => row.textContent)).toEqual([
      expect.stringContaining(first.title),
      expect.stringContaining(second.title),
      expect.stringContaining(third.title),
    ])
  })

  it('märker ut rummet man står i och länkar det inte', async () => {
    const here = stops[1]
    expect(here).toBeDefined()
    if (here === undefined) return
    await renderRoom(here.slug, PATH_SLUG)
    const current = trail()[1]
    expect(current).toBeDefined()
    if (current === undefined) return
    expect(current).toHaveAttribute('aria-current', 'true')
    expect(current.querySelector('a')).toBeNull()
    expect(within(current).getByText('Här är du på vandringen')).toBeInTheDocument()
  })

  it('bär vandringen vidare som sammanhang i grannarnas länkar', async () => {
    const here = stops[1]
    expect(here).toBeDefined()
    if (here === undefined) return
    await renderRoom(here.slug, PATH_SLUG)
    const links = screen.getByRole('list').querySelectorAll('a')
    expect(links).toHaveLength(2)
    for (const link of links) expect(link.getAttribute('href')).toContain(`vandring=${PATH_SLUG}`)
  })

  it('slutar med föregående anhalt och den avslutande reflektionen i sista rummet', async () => {
    const last = stops[stops.length - 1]
    const beforeLast = stops[stops.length - 2]
    expect(last && beforeLast).toBeTruthy()
    if (last === undefined || beforeLast === undefined) return
    await renderRoom(last.slug, PATH_SLUG)
    const rows = trail()
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent(beforeLast.title)
    expect(rows[1]).toHaveTextContent(last.title)
    expect(rows[1]).toHaveAttribute('aria-current', 'true')
    const [firstReflectionParagraph] = (path.closingReflection ?? '').split('\n\n')
    expect(firstReflectionParagraph).toBeTruthy()
    if (firstReflectionParagraph !== undefined)
      expect(document.body.textContent).toContain(firstReflectionParagraph)
  })

  // paths.md, Completion: foten är orientering, inte förlopp. Ingen räknare, inget
  // »X av Y«, ingen avbockning — och ingen knapp som pekar ut det rätta valet.
  it('räknar inte anhalter och framhäver inget val', async () => {
    const here = stops[1]
    expect(here).toBeDefined()
    if (here === undefined) return
    await renderRoom(here.slug, PATH_SLUG)
    const footer = screen.getByRole('list').textContent ?? ''
    expect(footer).not.toMatch(/\d+\s*av\s*\d+/)
    expect(footer).not.toMatch(/\d+\s*min\b/)
    expect(screen.queryByText('Fortsätt vandringen')).not.toBeInTheDocument()
  })
})
