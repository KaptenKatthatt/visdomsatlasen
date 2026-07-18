import { describe, expect, it } from 'vitest'
import type {
  Fraga,
  Kalla,
  Kallpassage,
  Person,
  Rum,
  Tema,
  Tradition,
  Vandring,
} from '../content/redaktion/schema'
import { byggSokindex, SOKTYPER, sokindexet, type Sokdokument } from './sokindex'

type Status = Rum['status']

const fraga = (id: string, status: Status = 'publicerad', över: Partial<Fraga> = {}): Fraga => ({
  id,
  slug: id,
  text: `Fråga ${id}`,
  teman: ['tema-x'],
  status,
  ...över,
})

const tema = (id: string, status: Status = 'publicerad', över: Partial<Tema> = {}): Tema => ({
  id,
  slug: id,
  etikett: `Tema ${id}`,
  status,
  ...över,
})

const rum = (id: string, status: Status = 'publicerad', över: Partial<Rum> = {}): Rum => ({
  id,
  slug: id,
  titel: `Rum ${id}`,
  sammanfattning: 'En sammanfattning.',
  primärFråga: 'fraga-1',
  teman: ['tema-1'],
  tankeAttBära: 'Bär detta.',
  reflektionsfrågor: ['Vad tänker du?'],
  källor: [{ källa: 'kalla-1', bruk: 'bearbetning', primär: true }],
  lästidMinuter: 6,
  språk: 'sv',
  status,
  skapad: '2026-07-14',
  uppdaterad: '2026-07-14',
  öppning: 'x',
  kärna: 'x',
  ...över,
})

const kalla = (id: string, status: Status = 'publicerad', över: Partial<Kalla> = {}): Kalla => ({
  id,
  slug: id,
  titel: `Källa ${id}`,
  typ: 'bok',
  rättigheter: 'public-domain',
  status,
  ...över,
})

const passage = (
  id: string,
  källa: string,
  status: Status = 'publicerad',
  över: Partial<Kallpassage> = {},
): Kallpassage => ({
  id,
  källa,
  referens: 'avsnitt 1',
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
  namn: `Tradition ${id}`,
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
  titel: `Vandring ${id}`,
  introduktion: 'En stilla introduktion till vandringen.',
  centralFråga: 'fraga-1',
  rum: ['rum-1', 'rum-2', 'rum-3'],
  status,
  skapad: '2026-07-14',
  uppdaterad: '2026-07-14',
  ...över,
})

const tomtIndex = {
  rum: [],
  teman: [],
  frågor: [],
  vandringar: [],
  källor: [],
  passager: [],
  traditioner: [],
  personer: [],
}

const person = (id: string, status: Status = 'publicerad'): Person => ({
  id,
  slug: id,
  namn: 'Alan Watts',
  årtal: '1915–1973',
  status,
  beskrivning: 'Västs mest inflytelserika uttolkare av österländskt tänkande.',
})

const hitta = (index: Sokdokument[], id: string): Sokdokument | undefined =>
  index.find((dok) => dok.id === id)

describe('byggSokindex — publiceringsgrind', () => {
  it('släpper aldrig in utkast, granskning eller arkiverat av någon typ', () => {
    const index = byggSokindex({
      ...tomtIndex,
      frågor: [fraga('fraga-pub'), fraga('fraga-utkast', 'utkast')],
      teman: [tema('tema-pub'), tema('tema-granskning', 'granskning')],
      rum: [rum('rum-pub'), rum('rum-arkiv', 'arkiverad')],
      vandringar: [vandring('vandring-utkast', 'utkast')],
      källor: [kalla('kalla-pub'), kalla('kalla-utkast', 'utkast')],
      traditioner: [tradition('trad-pub'), tradition('trad-granskning', 'granskning')],
    })
    const ids = index.map((dok) => dok.id).sort()
    expect(ids).toEqual(['fraga-pub', 'kalla-pub', 'rum-pub', 'tema-pub', 'trad-pub'])
  })

  it('utesluter en opublicerad passage även när dess källa är publicerad', () => {
    const index = byggSokindex({
      ...tomtIndex,
      källor: [kalla('kalla-1')],
      passager: [
        passage('p-pub', 'kalla-1', 'publicerad', { översättning: 'synligt citat' }),
        passage('p-utkast', 'kalla-1', 'utkast', { översättning: 'hemligt utkast' }),
      ],
    })
    const dok = hitta(index, 'kalla-1')
    expect(dok?.text.join(' ')).toContain('synligt citat')
    expect(dok?.text.join(' ')).not.toContain('hemligt utkast')
  })
})

describe('byggSokindex — personer', () => {
  it('indexerar publicerade personer med personpost-mål, årtal och beskrivning', () => {
    const index = byggSokindex({ ...tomtIndex, personer: [person('person-watts')] })
    const dok = hitta(index, 'person-watts')
    expect(dok?.typ).toBe('person')
    expect(dok?.titel).toBe('Alan Watts')
    expect(dok?.meta).toBe('1915–1973')
    expect(dok?.mal).toEqual({ kind: 'personpost', slug: 'person-watts' })
    expect(dok?.text.join(' ')).toContain('uttolkare')
  })

  it('släpper aldrig in utkastpersoner i indexet', () => {
    const index = byggSokindex({ ...tomtIndex, personer: [person('person-utkast', 'utkast')] })
    expect(index).toEqual([])
  })
})

describe('byggSokindex — fält per typ', () => {
  it('lägger källans originaltitel, alias och författare i alias-fältet', () => {
    const index = byggSokindex({
      ...tomtIndex,
      källor: [
        kalla('kalla-1', 'publicerad', {
          originaltitel: 'Enchiridion',
          alias: ['Handboken'],
          tillskrivenFörfattare: 'Epiktetos',
        }),
      ],
    })
    expect(hitta(index, 'kalla-1')?.alias).toEqual(['Enchiridion', 'Handboken', 'Epiktetos'])
  })

  it('ger rummet en meta med primärfrågans text och lästid', () => {
    const index = byggSokindex({
      ...tomtIndex,
      frågor: [fraga('fraga-1', 'publicerad', { text: 'Vad kan du styra?' })],
      rum: [rum('rum-1', 'publicerad', { primärFråga: 'fraga-1', lästidMinuter: 8 })],
    })
    expect(hitta(index, 'rum-1')?.meta).toBe('Vad kan du styra? · ca 8 min')
  })

  it('sätter frågans titel till frågetexten och pekar mot frågesidan', () => {
    const index = byggSokindex({ ...tomtIndex, frågor: [fraga('fraga-1', 'publicerad', { text: 'Hur lever man?' })] })
    const dok = hitta(index, 'fraga-1')
    expect(dok?.titel).toBe('Hur lever man?')
    expect(dok?.mal).toEqual({ kind: 'fraga', slug: 'fraga-1' })
  })

  it('lämnar traditioner utan sökmål (de har inga egna sidor)', () => {
    const index = byggSokindex({ ...tomtIndex, traditioner: [tradition('trad-1')] })
    expect(hitta(index, 'trad-1')?.mal).toBeUndefined()
  })
})

describe('sokindexet (det verkliga indexet)', () => {
  it('byggs ur laddat innehåll och är icke-tomt', () => {
    expect(sokindexet.length).toBeGreaterThan(0)
  })

  it('rymmer bara giltiga söktyper — inga läckta råposter', () => {
    const typer = new Set(sokindexet.map((dok) => dok.typ))
    for (const typ of typer) {
      expect(SOKTYPER).toContain(typ)
    }
  })
})
