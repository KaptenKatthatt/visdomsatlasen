// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { allPaths, allRooms, findSource, workName } from '../../lib/content'
import { roomsForPath } from '../../lib/library'
import { AtlasProvider } from '../../lib/store'
import { renderWithRouter } from '../../lib/testRouter'
import { PathReadPage } from './PathReadPage'

// jsdom saknar matchMedia; storen frågar efter systemets mörka läge vid
// montering. Stubben plockas bort efter varje test.
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

const SLUG = 'vagen-mot-lugn'

const path = allPaths.find((candidate) => candidate.slug === SLUG)
if (path === undefined) throw new Error(`Vandringen ${SLUG} saknas`)
const rooms = roomsForPath(path, allRooms)

const renderFlow = (slug: string = SLUG): Promise<void> =>
  renderWithRouter({
    page: () => <PathReadPage slug={slug} />,
    paths: ['/vandring/$slug', '/bibliotek/fraga/$slug'],
    wrapper: (children) => <AtlasProvider>{children}</AtlasProvider>,
  })

describe('PathReadPage', () => {
  it('bär vandringens titel som h1 och rummen i redaktionell ordning som h2', async () => {
    await renderFlow()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(path.title)
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((heading) => heading.textContent)).toEqual(
      rooms.map((room) => room.title),
    )
  })

  // Uppehållet är flödets enda avdelare: ett veck (···) före varje rum och ett
  // före avslutet, utöver rummens egna två veck (RoomText). Räkningen fäller
  // testet om något uppehåll försvinner eller dubbleras.
  it('lägger en tystnad före varje rum och före avslutet', async () => {
    await renderFlow()
    const dots = document.getElementsByClassName('dots')
    expect(dots).toHaveLength(3 * rooms.length + 1)
  })

  // Rummen i flödet är ren läsning (redaktörens beslut): ingen Spara, inga
  // anteckningar per rum — bara en ensam »Skriv ner en tanke« sist, för
  // vandringen som helhet.
  it('visar ingen Spara-knapp och bara en avslutande tankeknapp', async () => {
    await renderFlow()
    expect(screen.queryByRole('button', { name: 'Spara' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Skriv ner en tanke' })).toHaveLength(1)
  })

  // Källraden är stum: verkets namn, ingen utfällning, ingen väg bort mitt i
  // läsningen. Källapparaten bor i biblioteket — dit hör också titelns
  // parentesglossa (»Enchiridion (Handboken)«), som stryks här.
  it('visar verkets namn som stum källrad, utan glossa, länk eller knapp', async () => {
    await renderFlow()
    const [first] = rooms
    expect(first).toBeDefined()
    if (first === undefined) return
    const primary = first.sources.find((relation) => relation.primary) ?? first.sources[0]
    const source = primary ? findSource(primary.source) : undefined
    expect(source).toBeDefined()
    if (source === undefined) return
    const name = workName(source)
    const line = screen.getAllByText(name, { exact: false })[0]
    expect(line).toBeDefined()
    if (line === undefined) return
    expect(line.closest('a')).toBeNull()
    expect(line.closest('button')).toBeNull()
    expect(document.body.textContent).not.toContain('(Handboken)')
    expect(screen.queryByText('Om texten')).not.toBeInTheDocument()
  })

  it('slutar med reflektionen, den centrala frågan och luft — utan firande', async () => {
    await renderFlow()
    const [firstReflectionParagraph] = (path.closingReflection ?? '').split('\n\n')
    expect(firstReflectionParagraph).toBeTruthy()
    expect(document.body.textContent).toContain(firstReflectionParagraph)
    expect(document.body.textContent).not.toMatch(/\d+\s*av\s*\d+/)
    expect(document.body.textContent).not.toMatch(/\d+\s*min\b/)
    expect(screen.queryByText('Fortsätt vandringen')).not.toBeInTheDocument()
  })

  // Varje anhalt går att öppna mitt i flödet: förrummets länkar bär rummets
  // slug som hash, och ankaret måste finnas här.
  it('bär ett ankare per rum för förrummets anhaltslänkar', async () => {
    await renderFlow()
    for (const room of rooms) expect(document.getElementById(room.slug)).not.toBeNull()
  })

  // Man ska aldrig känna sig fångad i flödet: chevronen i bottenbaren leder
  // alltid tillbaka till förrummet.
  it('leder tillbaka till förrummet från bottenbaren', async () => {
    await renderFlow()
    const back = screen.getByRole('link', { name: 'Till vandringens översikt' })
    expect(back).toHaveAttribute('href', `/vandring/${SLUG}`)
  })

  // Anteckningen hör vandringen till, inte något rum — och Sparat måste kunna
  // hitta tillbaka till vandringen från den (noteToCard i SavedParts).
  it('skriver anteckningen med vandringen som ursprung', async () => {
    await renderFlow()
    await userEvent.click(screen.getByRole('button', { name: 'Skriv ner en tanke' }))
    await userEvent.type(screen.getByRole('textbox'), 'En tanke')
    const stored = JSON.parse(localStorage.getItem('visdomsatlasen') ?? '{}') as {
      notes?: Record<string, { originType?: string; originId?: string }>
    }
    expect(stored.notes?.[path.id]).toMatchObject({ originType: 'path', originId: path.id })
  })

  it('säger ifrån stillsamt när vandringen inte finns', async () => {
    await renderFlow('ingen-sadan-vandring')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vandringen')
  })
})
