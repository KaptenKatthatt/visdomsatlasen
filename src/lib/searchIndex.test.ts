import { describe, expect, it } from 'vitest'
import type {
  Question,
  Source,
  SourcePassage,
  Room,
  Theme,
  Tradition,
  Path,
} from '../content/editorial/schema'
import { buildSearchIndex, searchIndexData, type SearchDoc } from './searchIndex'

type Status = Room['status']

const question = (id: string, status: Status = 'published', overrides: Partial<Question> = {}): Question => ({
  id,
  slug: id,
  text: `Fråga ${id}`,
  themes: ['tema-x'],
  status,
  ...overrides,
})

const theme = (id: string, status: Status = 'published', overrides: Partial<Theme> = {}): Theme => ({
  id,
  slug: id,
  label: `Tema ${id}`,
  status,
  ...overrides,
})

const room = (id: string, status: Status = 'published', overrides: Partial<Room> = {}): Room => ({
  id,
  slug: id,
  title: `Rum ${id}`,
  summary: 'En sammanfattning.',
  primaryQuestion: 'fraga-1',
  themes: ['tema-1'],
  thoughtToCarry: 'Bär detta.',
  reflectionQuestions: ['Vad tänker du?'],
  sources: [{ source: 'kalla-1', use: 'adaptation', primary: true }],
  readingTimeMinutes: 6,
  language: 'sv',
  status,
  created: '2026-07-14',
  updated: '2026-07-14',
  opening: 'x',
  core: 'x',
  ...overrides,
})

const source = (id: string, status: Status = 'published', overrides: Partial<Source> = {}): Source => ({
  id,
  slug: id,
  title: `Källa ${id}`,
  type: 'book',
  rights: 'public-domain',
  status,
  ...overrides,
})

const passage = (
  id: string,
  source: string,
  status: Status = 'published',
  overrides: Partial<SourcePassage> = {},
): SourcePassage => ({
  id,
  source,
  reference: 'avsnitt 1',
  status,
  ...overrides,
})

const tradition = (
  id: string,
  status: Status = 'published',
  overrides: Partial<Tradition> = {},
): Tradition => ({
  id,
  slug: id,
  name: `Tradition ${id}`,
  status,
  ...overrides,
})

const path = (
  id: string,
  status: Status = 'published',
  overrides: Partial<Path> = {},
): Path => ({
  id,
  slug: id,
  title: `Vandring ${id}`,
  introduction: 'En stilla introduktion till vandringen.',
  centralQuestion: 'fraga-1',
  rooms: ['rum-1', 'rum-2', 'rum-3'],
  status,
  created: '2026-07-14',
  updated: '2026-07-14',
  ...overrides,
})

const emptyIndex = {
  rooms: [],
  themes: [],
  questions: [],
  paths: [],
  sources: [],
  passages: [],
  traditions: [],
  people: [],
}

const find = (index: SearchDoc[], id: string): SearchDoc | undefined =>
  index.find((doc) => doc.id === id)

describe('byggSokindex — publiceringsgrind', () => {
  it('släpper aldrig in utkast, granskning eller arkiverat av någon typ', () => {
    const index = buildSearchIndex({
      ...emptyIndex,
      questions: [question('fraga-pub'), question('fraga-utkast', 'draft')],
      themes: [theme('tema-pub'), theme('tema-granskning', 'review')],
      rooms: [room('rum-pub'), room('rum-arkiv', 'archived')],
      paths: [path('vandring-utkast', 'draft')],
      sources: [source('kalla-pub'), source('kalla-utkast', 'draft')],
      traditions: [tradition('trad-pub'), tradition('trad-granskning', 'review')],
    })
    const ids = index.map((doc) => doc.id).sort()
    expect(ids).toEqual(['fraga-pub', 'kalla-pub', 'rum-pub', 'tema-pub', 'trad-pub'])
  })

  it('utesluter en opublicerad passage även när dess källa är publicerad', () => {
    const index = buildSearchIndex({
      ...emptyIndex,
      sources: [source('kalla-1')],
      passages: [
        passage('p-pub', 'kalla-1', 'published', { translation: 'synligt citat' }),
        passage('p-utkast', 'kalla-1', 'draft', { translation: 'hemligt utkast' }),
      ],
    })
    const doc = find(index, 'kalla-1')
    expect(doc?.text.join(' ')).toContain('synligt citat')
    expect(doc?.text.join(' ')).not.toContain('hemligt utkast')
  })
})

describe('byggSokindex — fält per typ', () => {
  it('lägger källans originalTitle, alias och författare i alias-fältet', () => {
    const index = buildSearchIndex({
      ...emptyIndex,
      sources: [
        source('kalla-1', 'published', {
          originalTitle: 'Enchiridion',
          alias: ['Handboken'],
          attributedAuthor: 'Epiktetos',
        }),
      ],
    })
    expect(find(index, 'kalla-1')?.alias).toEqual(['Enchiridion', 'Handboken', 'Epiktetos'])
  })

  it('ger rummet en meta med primärfrågans text och lästid', () => {
    const index = buildSearchIndex({
      ...emptyIndex,
      questions: [question('fraga-1', 'published', { text: 'Vad kan du styra?' })],
      rooms: [room('rum-1', 'published', { primaryQuestion: 'fraga-1', readingTimeMinutes: 8 })],
    })
    expect(find(index, 'rum-1')?.meta).toBe('Vad kan du styra? · ca 8 min')
  })

  it('sätter frågans titel till frågetexten och pekar mot frågesidan', () => {
    const index = buildSearchIndex({ ...emptyIndex, questions: [question('fraga-1', 'published', { text: 'Hur lever man?' })] })
    const doc = find(index, 'fraga-1')
    expect(doc?.title).toBe('Hur lever man?')
    expect(doc?.target).toEqual({ kind: 'fraga', slug: 'fraga-1' })
  })

  it('lämnar traditioner utan sökmål (de har inga egna sidor)', () => {
    const index = buildSearchIndex({ ...emptyIndex, traditions: [tradition('trad-1')] })
    expect(find(index, 'trad-1')?.target).toBeUndefined()
  })
})

describe('sokindexet (det verkliga indexet)', () => {
  it('byggs ur laddat innehåll och är icke-tomt', () => {
    expect(searchIndexData.length).toBeGreaterThan(0)
  })

  it('rymmer bara giltiga söktyper — inga läckta råposter', () => {
    const types = new Set(searchIndexData.map((doc) => doc.type))
    for (const type of types) {
      expect(['fraga', 'tema', 'rum', 'vandring', 'kalla', 'tradition', 'person']).toContain(type)
    }
  })
})
