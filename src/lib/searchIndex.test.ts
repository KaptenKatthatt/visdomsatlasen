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
import { byggSokindex, searchIndexData, type SearchDoc } from './searchIndex'

type Status = Room['status']

const fraga = (id: string, status: Status = 'published', över: Partial<Question> = {}): Question => ({
  id,
  slug: id,
  text: `Fråga ${id}`,
  themes: ['tema-x'],
  status,
  ...över,
})

const tema = (id: string, status: Status = 'published', över: Partial<Theme> = {}): Theme => ({
  id,
  slug: id,
  label: `Tema ${id}`,
  status,
  ...över,
})

const rum = (id: string, status: Status = 'published', över: Partial<Room> = {}): Room => ({
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
  ...över,
})

const kalla = (id: string, status: Status = 'published', över: Partial<Source> = {}): Source => ({
  id,
  slug: id,
  title: `Källa ${id}`,
  type: 'book',
  rights: 'public-domain',
  status,
  ...över,
})

const passage = (
  id: string,
  source: string,
  status: Status = 'published',
  över: Partial<SourcePassage> = {},
): SourcePassage => ({
  id,
  source,
  reference: 'avsnitt 1',
  status,
  ...över,
})

const tradition = (
  id: string,
  status: Status = 'published',
  över: Partial<Tradition> = {},
): Tradition => ({
  id,
  slug: id,
  name: `Tradition ${id}`,
  status,
  ...över,
})

const vandring = (
  id: string,
  status: Status = 'published',
  över: Partial<Path> = {},
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
  ...över,
})

const tomtIndex = {
  rooms: [],
  themes: [],
  questions: [],
  paths: [],
  sources: [],
  passages: [],
  traditions: [],
  people: [],
}

const hitta = (index: SearchDoc[], id: string): SearchDoc | undefined =>
  index.find((dok) => dok.id === id)

describe('byggSokindex — publiceringsgrind', () => {
  it('släpper aldrig in utkast, granskning eller arkiverat av någon typ', () => {
    const index = byggSokindex({
      ...tomtIndex,
      questions: [fraga('fraga-pub'), fraga('fraga-utkast', 'draft')],
      themes: [tema('tema-pub'), tema('tema-granskning', 'review')],
      rooms: [rum('rum-pub'), rum('rum-arkiv', 'archived')],
      paths: [vandring('vandring-utkast', 'draft')],
      sources: [kalla('kalla-pub'), kalla('kalla-utkast', 'draft')],
      traditions: [tradition('trad-pub'), tradition('trad-granskning', 'review')],
    })
    const ids = index.map((dok) => dok.id).sort()
    expect(ids).toEqual(['fraga-pub', 'kalla-pub', 'rum-pub', 'tema-pub', 'trad-pub'])
  })

  it('utesluter en opublicerad passage även när dess källa är publicerad', () => {
    const index = byggSokindex({
      ...tomtIndex,
      sources: [kalla('kalla-1')],
      passages: [
        passage('p-pub', 'kalla-1', 'published', { translation: 'synligt citat' }),
        passage('p-utkast', 'kalla-1', 'draft', { translation: 'hemligt utkast' }),
      ],
    })
    const dok = hitta(index, 'kalla-1')
    expect(dok?.text.join(' ')).toContain('synligt citat')
    expect(dok?.text.join(' ')).not.toContain('hemligt utkast')
  })
})

describe('byggSokindex — fält per typ', () => {
  it('lägger källans originalTitle, alias och författare i alias-fältet', () => {
    const index = byggSokindex({
      ...tomtIndex,
      sources: [
        kalla('kalla-1', 'published', {
          originalTitle: 'Enchiridion',
          alias: ['Handboken'],
          attributedAuthor: 'Epiktetos',
        }),
      ],
    })
    expect(hitta(index, 'kalla-1')?.alias).toEqual(['Enchiridion', 'Handboken', 'Epiktetos'])
  })

  it('ger rummet en meta med primärfrågans text och lästid', () => {
    const index = byggSokindex({
      ...tomtIndex,
      questions: [fraga('fraga-1', 'published', { text: 'Vad kan du styra?' })],
      rooms: [rum('rum-1', 'published', { primaryQuestion: 'fraga-1', readingTimeMinutes: 8 })],
    })
    expect(hitta(index, 'rum-1')?.meta).toBe('Vad kan du styra? · ca 8 min')
  })

  it('sätter frågans titel till frågetexten och pekar mot frågesidan', () => {
    const index = byggSokindex({ ...tomtIndex, questions: [fraga('fraga-1', 'published', { text: 'Hur lever man?' })] })
    const dok = hitta(index, 'fraga-1')
    expect(dok?.title).toBe('Hur lever man?')
    expect(dok?.target).toEqual({ kind: 'fraga', slug: 'fraga-1' })
  })

  it('lämnar traditioner utan sökmål (de har inga egna sidor)', () => {
    const index = byggSokindex({ ...tomtIndex, traditions: [tradition('trad-1')] })
    expect(hitta(index, 'trad-1')?.target).toBeUndefined()
  })
})

describe('sokindexet (det verkliga indexet)', () => {
  it('byggs ur laddat innehåll och är icke-tomt', () => {
    expect(searchIndexData.length).toBeGreaterThan(0)
  })

  it('rymmer bara giltiga söktyper — inga läckta råposter', () => {
    const typer = new Set(searchIndexData.map((dok) => dok.type))
    for (const type of typer) {
      expect(['fraga', 'tema', 'rum', 'vandring', 'kalla', 'tradition', 'person']).toContain(type)
    }
  })
})
