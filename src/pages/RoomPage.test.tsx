// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import type { Room } from '../content/editorial/schema'
import { allPaths, allRooms } from '../lib/content'
import { roomsForPath } from '../lib/library'
import { AtlasProvider } from '../lib/store'
import { renderWithRouter } from '../lib/testRouter'
import { RoomPage } from './RoomPage'

// jsdom saknar matchMedia; storen frågar efter systemets mörka läge vid montering.
// Foten bryr sig inte om temat, så en stum ljus-svarare räcker. Stubben plockas
// bort efter varje test, så den aldrig läcker till andra filer.
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
})

const PATH_SLUG = 'vagen-mot-lugn'

const path = allPaths.find((candidate) => candidate.slug === PATH_SLUG)
if (path === undefined) throw new Error(`Vandringen ${PATH_SLUG} saknas`)
const stops = roomsForPath(path, allRooms)

/** The fixture's stops by position, counted from the end for negative indices.
 * Throws rather than skipping, so a change to the walk fails the test loudly
 * instead of letting it pass on nothing. */
const stopAt = (index: number): Room => {
  const room = stops.at(index)
  if (room === undefined) throw new Error(`Vandringen ${PATH_SLUG} saknar anhalt ${index}`)
  return room
}

const renderRoom = (slug: string, pathSlug?: string): Promise<void> =>
  renderWithRouter({
    page: () => <RoomPage slug={slug} pathSlug={pathSlug} />,
    paths: ['/rum/$slug', '/bibliotek/kalla/$slug'],
    wrapper: (children) => <AtlasProvider>{children}</AtlasProvider>,
  })

// The footer is the only list in the reading room, so it is unambiguous here.
const trail = (): HTMLElement[] => [...screen.getByRole('list').querySelectorAll('li')]

describe('RoomPage utan vandring', () => {
  it('visar ingen vandringsfot när rummet läses fristående', async () => {
    await renderRoom(stopAt(0).slug)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

describe('RoomPage vandringsfot', () => {
  it('visar bara nästa anhalt i första rummet', async () => {
    await renderRoom(stopAt(0).slug, PATH_SLUG)
    expect(trail().map((row) => row.textContent)).toEqual([
      expect.stringContaining(stopAt(0).title),
      expect.stringContaining(stopAt(1).title),
    ])
  })

  it('visar föregående och nästa anhalt i ett rum mitt på leden', async () => {
    await renderRoom(stopAt(1).slug, PATH_SLUG)
    expect(trail().map((row) => row.textContent)).toEqual([
      expect.stringContaining(stopAt(0).title),
      expect.stringContaining(stopAt(1).title),
      expect.stringContaining(stopAt(2).title),
    ])
  })

  it('märker ut rummet man står i och länkar det inte', async () => {
    await renderRoom(stopAt(1).slug, PATH_SLUG)
    const current = trail()[1]
    expect(current).toBeDefined()
    if (current === undefined) return
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current.querySelector('a')).toBeNull()
    expect(within(current).getByText('Här är du på vandringen')).toBeInTheDocument()
  })

  it('bär vandringen vidare som sammanhang i grannarnas länkar', async () => {
    await renderRoom(stopAt(1).slug, PATH_SLUG)
    const links = screen.getByRole('list').querySelectorAll('a')
    expect(links).toHaveLength(2)
    for (const link of links) expect(link.getAttribute('href')).toContain(`vandring=${PATH_SLUG}`)
  })

  it('slutar med föregående anhalt och den avslutande reflektionen i sista rummet', async () => {
    await renderRoom(stopAt(-1).slug, PATH_SLUG)
    expect(trail().map((row) => row.textContent)).toEqual([
      expect.stringContaining(stopAt(-2).title),
      expect.stringContaining(stopAt(-1).title),
    ])
    const rows = trail()
    expect(rows[rows.length - 1]).toHaveAttribute('aria-current', 'page')
    const [firstReflectionParagraph] = (path.closingReflection ?? '').split('\n\n')
    expect(firstReflectionParagraph).toBeTruthy()
    expect(document.body.textContent).toContain(firstReflectionParagraph)
  })

  // paths.md, One Stop at a Time: inne i läsrummet ska navigeringen dra sig undan.
  // Anhalterna bär bara sina titlar — grannrummens prosa hör hemma på översikten.
  it('visar ingen sammanfattning för grannarna', async () => {
    await renderRoom(stopAt(1).slug, PATH_SLUG)
    const footer = screen.getByRole('list').textContent ?? ''
    for (const offset of [0, 2]) expect(footer).not.toContain(stopAt(offset).summary)
  })

  // paths.md, Completion: foten är orientering, inte förlopp. Ingen räknare, inget
  // »X av Y«, ingen avbockning — och ingen knapp som pekar ut det rätta valet.
  it('räknar inte anhalter och framhäver inget val', async () => {
    await renderRoom(stopAt(1).slug, PATH_SLUG)
    const footer = screen.getByRole('list').textContent ?? ''
    expect(footer).not.toMatch(/\d+\s*av\s*\d+/)
    expect(footer).not.toMatch(/\d+\s*min\b/)
    expect(screen.queryByText('Fortsätt vandringen')).not.toBeInTheDocument()
  })
})
