// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { allPaths, allRooms } from '../../lib/content'
import { roomsForPath } from '../../lib/library'
import { PathPage } from './PathPage'

afterEach(cleanup)

const SLUG = 'vagen-mot-lugn'

/** A minimal memory router: PathPage's links point at real routes, so the page
 * needs somewhere for them to resolve. Only the targets the page links to exist —
 * the walk itself is what's under test, not the routing. */
const renderPath = async (slug: string): Promise<void> => {
  const rootRoute = createRootRoute()
  const routes = [
    createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => <PathPage slug={slug} /> }),
    createRoute({ getParentRoute: () => rootRoute, path: '/rum/$slug', component: () => null }),
    createRoute({ getParentRoute: () => rootRoute, path: '/bibliotek/fraga/$slug', component: () => null }),
  ]
  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  render(<RouterProvider router={router} />)
  await screen.findByRole('heading', { level: 1 })
}

describe('PathPage', () => {
  it('visar anhalterna som en ordnad lista i redaktionell ordning', async () => {
    await renderPath(SLUG)
    const path = allPaths.find((candidate) => candidate.slug === SLUG)
    expect(path).toBeDefined()
    if (path === undefined) return
    const titles = roomsForPath(path, allRooms).map((room) => room.title)
    const trail = screen.getByRole('list')
    expect(trail.tagName).toBe('OL')
    // Explicit role: list-style: none gör att WebKit tappar listsemantiken, och
    // listan är det enda som bär sekvensen. jsdom härmar inte den strykningen, så
    // attributet måste kontrolleras direkt.
    expect(trail).toHaveAttribute('role', 'list')
    const stops = trail.querySelectorAll('li')
    expect([...stops].map((stop) => stop.querySelector('a')?.textContent)).toEqual(
      titles.map((title) => expect.stringContaining(title)),
    )
  })

  it('öppnar varje anhalt med vandringen som sammanhang', async () => {
    await renderPath(SLUG)
    for (const link of screen.getByRole('list').querySelectorAll('a'))
      expect(link.getAttribute('href')).toContain(`vandring=${SLUG}`)
  })

  it('bär varje anhalts egen tanke som underrad', async () => {
    await renderPath(SLUG)
    const path = allPaths.find((candidate) => candidate.slug === SLUG)
    expect(path).toBeDefined()
    if (path === undefined) return
    for (const room of roomsForPath(path, allRooms))
      expect(screen.getByText(room.summary)).toBeInTheDocument()
  })

  // paths.md, Completion + Path Overview: the overview must not read as a syllabus.
  // No reading times, no totals, no counts — and (editor's decision 2026-07-26) no
  // »Fortsätt där du stannade« cue on the trail itself.
  // Matcha formen »4 min«, inte ordet »min« — det senare är ett vanligt svenskt
  // ord som skulle fälla grinden så fort en sammanfattning råkade innehålla det.
  it('visar ingen lästid, totaltid eller återupptagningsrad', async () => {
    await renderPath(SLUG)
    expect(document.body.textContent).not.toMatch(/\d+\s*min\b/)
    expect(screen.queryByText(/Fortsätt där du stannade/)).not.toBeInTheDocument()
  })

  it('säger ifrån stillsamt när vandringen inte finns', async () => {
    await renderPath('ingen-sadan-vandring')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vandringen')
  })
})
