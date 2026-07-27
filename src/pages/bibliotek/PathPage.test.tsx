// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { allPaths, allRooms } from '../../lib/content'
import { roomsForPath } from '../../lib/library'
import { renderWithRouter } from '../../lib/testRouter'
import { PathPage } from './PathPage'

afterEach(cleanup)

const SLUG = 'vagen-mot-lugn'

const renderPath = (slug: string): Promise<void> =>
  renderWithRouter({
    page: () => <PathPage slug={slug} />,
    paths: ['/rum/$slug', '/bibliotek/fraga/$slug'],
  })

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
