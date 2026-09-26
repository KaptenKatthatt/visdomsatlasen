import { describe, expect, it } from 'vitest'
import { exportContent } from './export'
import { pathSchema, roomSchema, themeSchema, type ContentSet, type Room } from './schema'

const room = (id: string, status: Room['status'], extra: Partial<Room> = {}): Room =>
  roomSchema.parse({
    id,
    slug: id,
    title: `Rum ${id}`,
    summary: 'En sammanfattning.',
    primaryQuestion: 'fraga-1',
    themes: ['tema-lugn'],
    thoughtToCarry: 'En tanke att bära.',
    reflectionQuestions: ['Vad bär du?'],
    sources: [
      { source: 'kalla-1', reference: 'avsnitt 1', use: 'paraphrase', primary: true, editorialNote: 'intern' },
    ],
    readingTimeMinutes: 3,
    status,
    created: '2026-09-01',
    updated: '2026-09-02',
    editorial: { writer: 'Redaktören', notes: 'Intern anteckning.' },
    opening: 'Första stycket\nfortsätter här.\n\nAndra stycket.',
    core: 'Kärnan.',
    historicalContext: 'Bakgrunden.',
    ...extra,
  })

const emptySet: ContentSet = {
  rooms: [],
  themes: [],
  questions: [],
  paths: [],
  sources: [],
  passages: [],
  traditions: [],
  people: [],
}

describe('exportContent', () => {
  it('tar bara med publicerade rum', () => {
    const content = exportContent({
      ...emptySet,
      rooms: [room('a', 'published'), room('b', 'draft'), room('c', 'published')],
    })
    expect(content.rooms.map((r) => r.id)).toEqual(['a', 'c'])
  })

  it('delar stycken och gör inre radbrytningar till mellanslag', () => {
    const [exported] = exportContent({ ...emptySet, rooms: [room('a', 'published')] }).rooms
    expect(exported?.opening).toEqual(['Första stycket fortsätter här.', 'Andra stycket.'])
    expect(exported?.core).toEqual(['Kärnan.'])
  })

  it('ger en tom lista när rummet saknar historisk bakgrund', () => {
    const [exported] = exportContent({
      ...emptySet,
      rooms: [room('a', 'published', { historicalContext: undefined })],
    }).rooms
    expect(exported?.historicalContext).toEqual([])
  })

  it('lämnar redaktionell metadata och datum utanför', () => {
    const [exported] = exportContent({ ...emptySet, rooms: [room('a', 'published')] }).rooms
    expect(exported).not.toHaveProperty('editorial')
    expect(exported).not.toHaveProperty('created')
    expect(exported).not.toHaveProperty('updated')
    expect(exported).not.toHaveProperty('status')
    expect(exported?.sources).toEqual([{ source: 'kalla-1', reference: 'avsnitt 1', use: 'paraphrase', primary: true }])
  })

  it('numrerar temana i redaktionell ordning utan luckor, oordnade sist', () => {
    const theme = (id: string, label: string, order?: number) =>
      themeSchema.parse({ id, slug: id, label, status: 'published', ...(order === undefined ? {} : { order }) })
    const content = exportContent({
      ...emptySet,
      themes: [theme('t-mod', 'Mod', 5), theme('t-tro', 'Tro'), theme('t-lugn', 'Lugn', 2)],
    })
    expect(content.themes.map((t) => [t.label, t.order])).toEqual([
      ['Lugn', 1],
      ['Mod', 2],
      ['Tro', 3],
    ])
  })

  it('ger en vandring utan avslutande reflektion en tom sträng', () => {
    const path = pathSchema.parse({
      id: 'v-1',
      slug: 'v-1',
      title: 'En vandring',
      introduction: 'Inledning\npå två rader.',
      centralQuestion: 'fraga-1',
      rooms: ['a', 'b', 'c'],
      status: 'published',
      created: '2026-09-01',
      updated: '2026-09-02',
    })
    const [exported] = exportContent({ ...emptySet, paths: [path] }).paths
    expect(exported?.introduction).toBe('Inledning på två rader.')
    expect(exported?.closingReflection).toBe('')
  })
})
