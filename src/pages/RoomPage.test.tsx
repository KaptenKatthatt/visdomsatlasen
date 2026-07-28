// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { allRooms } from '../lib/content'
import { AtlasProvider } from '../lib/store'
import { renderWithRouter } from '../lib/testRouter'
import { RoomPage } from './RoomPage'

// jsdom saknar matchMedia; storen frågar efter systemets mörka läge vid montering.
// Sidan bryr sig inte om temat, så en stum ljus-svarare räcker. Stubben plockas
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

const room = allRooms.find((candidate) => candidate.status === 'published')
if (room === undefined) throw new Error('Inget publicerat rum att testa mot')

const renderRoom = (slug: string): Promise<void> =>
  renderWithRouter({
    page: () => <RoomPage slug={slug} />,
    paths: ['/bibliotek/kalla/$slug'],
    wrapper: (children) => <AtlasProvider>{children}</AtlasProvider>,
  })

// Rummet läses alltid fristående — vandringar läses i sitt eget flöde
// (PathReadPage), aldrig rum för rum här (paths.md, Relationship to the Library).
describe('RoomPage', () => {
  it('visar ingen stig eller vandringsfot', async () => {
    await renderRoom(room.slug)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByText('Här är du på vandringen')).not.toBeInTheDocument()
    expect(screen.queryByText('Fortsätt vandringen')).not.toBeInTheDocument()
  })

  it('slutar med rummets inåtvända handlingar', async () => {
    await renderRoom(room.slug)
    expect(screen.getByRole('button', { name: 'Spara' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Skriv ner en tanke' })).toBeInTheDocument()
  })

  it('bär rummets text med rubrik, tanke och frågor', async () => {
    await renderRoom(room.slug)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(room.title)
    expect(screen.getByText(room.thoughtToCarry)).toBeInTheDocument()
    for (const question of room.reflectionQuestions)
      expect(screen.getByText(question)).toBeInTheDocument()
  })
})
