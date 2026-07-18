import { describe, expect, it } from 'vitest'
import type {
  Fraga,
  Kalla,
  Kallpassage,
  Rum,
  Tema,
  Tradition,
  Vandring,
} from '../content/editorial/schema'
import { byggSokindex, sokindexet, type Sokdokument } from './sokindex'

type Status = Rum['status']

const fraga = (id: string, status: Status = 'publicerad', över: Partial<Fraga> = {}): Fraga => ({
  id,
  slug: id,
  text: `Fråga ${id}`,
  themes: ['tema-x'],
  status,
  ...över,
})

const tema = (id: string, status: Status = 'publicerad', över: Partial<Tema> = {}): Tema => ({
  id,
  slug: id,
  label: `Tema ${id}`,
  status,
  ...över,
})

const rum = (id: string, status: Status = 'publicerad', över: Partial<Rum> = {}): Rum => ({
  id,
  slug: id,
  title: `Rum ${id}`,
  summary: 'En summary.',
  primaryQuestion: 'fraga-1',
  themes: ['tema-1'],
  thoughtToCarry: 'Bär detta.',
  reflectionQuestions: ['Vad tänker du?'],
  sources: [{ source: 'kalla-1', use: 'bearbetning', primary: true }],
  readingTimeMinutes: 6,
  language: 'sv',
  status,
  created: '2026-07-14',
  updated: '2026-07-14',
  opening: 'x',
  core: 'x',
  ...över,
})

const kalla = (id: string, status: Status = 'publicerad', över: Partial<Kalla> = {}): Kalla => ({
  id,
  slug: id,
  title: `Källa ${id}`,
  type: 'bok',
  rights: 'public-domain',
  status,
  ...över,
})

const passage = (
  id: string,
  source: string,
  status: Status = 'publicerad',
  över: Partial<Kallpassage> = {},
): Kallpassage => ({
  id,
  source,
  reference: 'avsnitt 1',
  status,
  ...över,
})

const tradition = (
  id: string,
  status: Status = 'publicerad',
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
  status: Status = 'publicerad',
  över: Partial<Vandring> = {},
): Vandring => ({
  id,
  slug: id,
  title: `Vandring ${id}`,
  introduction: 'En stilla introduction till vandringen.',
  centralQuestion: 'fraga-1',
  rum: ['rum-1', 'rum-2', 'rum-3'],
  status,
  created: '2026-07-14',
  updated: '2026-07-14',
  ...över,
})

const tomtIndex = {
  rum: [],
  themes: [],
  frågor: [],
  vandringar: [],
  sources: [],
  passager: [],
  traditions: [],
}

const hitta = (index: Sokdokument[], id: string): Sokdokument | undefined =>
  index.find((dok) => dok.id === id)

describe('byggSokindex — publiceringsgrind', () => {
  it('släpper aldrig in utkast, granskning eller arkiverat av någon type', () => {
    const index = byggSokindex({
      ...tomtIndex,
      frågor: [fraga('fraga-pub'), fraga('fraga-utkast', 'utkast')],
      themes: [tema('tema-pub'), tema('tema-granskning', 'granskning')],
      rum: [rum('rum-pub'), rum('rum-arkiv', 'arkiverad')],
      vandringar: [vandring('vandring-utkast', 'utkast')],
      sources: [kalla('kalla-pub'), kalla('kalla-utkast', 'utkast')],
      traditions: [tradition('trad-pub'), tradition('trad-granskning', 'granskning')],
    })
    const ids = index.map((dok) => dok.id).sort()
    expect(ids).toEqual(['fraga-pub', 'kalla-pub', 'rum-pub', 'tema-pub', 'trad-pub'])
  })

  it('utesluter en opublicerad passage även när dess source är publicerad', () => {
    const index = byggSokindex({
      ...tomtIndex,
      sources: [kalla('kalla-1')],
      passager: [
        passage('p-pub', 'kalla-1', 'publicerad', { translation: 'synligt citat' }),
        passage('p-utkast', 'kalla-1', 'utkast', { translation: 'hemligt utkast' }),
      ],
    })
    const dok = hitta(index, 'kalla-1')
    expect(dok?.text.join(' ')).toContain('synligt citat')
    expect(dok?.text.join(' ')).not.toContain('hemligt utkast')
  })
})

describe('byggSokindex — fält per type', () => {
  it('lägger källans originalTitle, alias och author i alias-fältet', () => {
    const index = byggSokindex({
      ...tomtIndex,
      sources: [
        kalla('kalla-1', 'publicerad', {
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
      frågor: [fraga('fraga-1', 'publicerad', { text: 'Vad kan du styra?' })],
      rum: [rum('rum-1', 'publicerad', { primaryQuestion: 'fraga-1', readingTimeMinutes: 8 })],
    })
    expect(hitta(index, 'rum-1')?.meta).toBe('Vad kan du styra? · ca 8 min')
  })

  it('sätter frågans title till frågetexten och pekar mot frågesidan', () => {
    const index = byggSokindex({ ...tomtIndex, frågor: [fraga('fraga-1', 'publicerad', { text: 'Hur lever man?' })] })
    const dok = hitta(index, 'fraga-1')
    expect(dok?.title).toBe('Hur lever man?')
    expect(dok?.mal).toEqual({ kind: 'fraga', slug: 'fraga-1' })
  })

  it('lämnar traditions utan sökmål (de har inga egna sidor)', () => {
    const index = byggSokindex({ ...tomtIndex, traditions: [tradition('trad-1')] })
    expect(hitta(index, 'trad-1')?.mal).toBeUndefined()
  })
})

describe('sokindexet (det verkliga indexet)', () => {
  it('byggs ur laddat innehåll och är icke-tomt', () => {
    expect(sokindexet.length).toBeGreaterThan(0)
  })

  it('rymmer bara giltiga söktyper — inga läckta råposter', () => {
    const typer = new Set(sokindexet.map((dok) => dok.type))
    for (const type of typer) {
      expect(['fraga', 'tema', 'rum', 'vandring', 'kalla', 'tradition']).toContain(type)
    }
  })
})
