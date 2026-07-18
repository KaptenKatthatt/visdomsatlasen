import { describe, expect, it } from 'vitest'
import type { Question, Source, SourcePassage, Room, Theme, Tradition, Path } from '../content/editorial/schema'
import {
  bibliotekRum,
  bibliotekTeman,
  bibliotekTraditioner,
  bibliotekVandringar,
  fragorForTema,
  kallorForFraga,
  passagerForKalla,
  publiceradeVia,
  rumForFraga,
  rumForKalla,
  rumForVandring,
  traditionerForVandring,
  vandringLastid,
} from './bibliotek'

// Fabricerade poster: bara fälten biblioteket läser behöver vara meningsfulla.
const rum = (title: string, status: Room['status'] = 'publicerad', över: Partial<Room> = {}): Room => ({
  id: `rum-${title}`,
  slug: title,
  title,
  summary: 'x',
  primaryQuestion: 'fraga-x',
  themes: ['tema-x'],
  thoughtToCarry: 'x',
  reflectionQuestions: ['x?'],
  sources: [{ source: 'kalla-x', use: 'bearbetning', primary: true }],
  readingTimeMinutes: 4,
  language: 'sv',
  status,
  created: '2026-07-12',
  updated: '2026-07-12',
  opening: 'x',
  core: 'x',
  ...över,
})

const tema = (
  label: string,
  extra: Partial<Pick<Theme, 'status' | 'order'>> = {},
): Theme => ({
  id: `tema-${label}`,
  slug: label,
  label,
  status: 'publicerad',
  ...extra,
})

describe('bibliotekTeman', () => {
  it('släpper bara igenom publicerade themes — utkast hör inte hemma i biblioteket', () => {
    const themes = [
      tema('lugn'),
      tema('mod', { status: 'utkast' }),
      tema('sanning', { status: 'granskning' }),
      tema('mening', { status: 'arkiverad' }),
    ]
    expect(bibliotekTeman(themes).map((t) => t.label)).toEqual(['lugn'])
  })

  it('följer redaktionell order och därefter svensk etikettordning', () => {
    const themes = [
      tema('österlandet'),
      tema('ande'),
      tema('mening', { order: 2 }),
      tema('lugn', { order: 1 }),
    ]
    // Ordnade themes först; oordnade sist i svensk order (ö efter a).
    expect(bibliotekTeman(themes).map((t) => t.label)).toEqual([
      'lugn',
      'mening',
      'ande',
      'österlandet',
    ])
  })
})

describe('bibliotekRum', () => {
  it('släpper bara igenom publicerade rum, i svensk titelordning', () => {
    const alla = [
      rum('över tröskeln'),
      rum('att vänta'),
      rum('utkastet', 'utkast'),
      rum('granskningen', 'granskning'),
      rum('arkivet', 'arkiverad'),
    ]
    expect(bibliotekRum(alla).map((r) => r.title)).toEqual(['att vänta', 'över tröskeln'])
  })
})

const fråga = (text: string, över: Partial<Question> = {}): Question => ({
  id: `fraga-${text}`,
  slug: text,
  text,
  themes: ['tema-x'],
  status: 'publicerad',
  ...över,
})

describe('rumForFraga', () => {
  it('sätter rum med frågan som primary först, sedan relaterade — bara publicerade', () => {
    const alla = [
      rum('önskan', 'publicerad', { primaryQuestion: 'fraga-b', relatedQuestions: ['fraga-a'] }),
      rum('besked', 'publicerad', { primaryQuestion: 'fraga-a' }),
      rum('utkastet', 'utkast', { primaryQuestion: 'fraga-a' }),
      rum('annat', 'publicerad', { primaryQuestion: 'fraga-b' }),
      rum('avstånd', 'publicerad', { primaryQuestion: 'fraga-a' }),
    ]
    expect(rumForFraga('fraga-a', alla).map((r) => r.title)).toEqual([
      'avstånd',
      'besked',
      'önskan',
    ])
  })

  it('räknar inte samma rum två gånger när frågan är både primary och relaterad', () => {
    const alla = [
      rum('dubblerat', 'publicerad', { primaryQuestion: 'fraga-a', relatedQuestions: ['fraga-a'] }),
    ]
    expect(rumForFraga('fraga-a', alla).map((r) => r.title)).toEqual(['dubblerat'])
  })
})

describe('fragorForTema', () => {
  it('släpper bara igenom publicerade frågor taggade med temat, i svensk order', () => {
    const alla = [
      fråga('Vad är sant?', { themes: ['tema-a'] }),
      fråga('Är detta viktigt?', { themes: ['tema-a'] }),
      fråga('Utkastfråga?', { themes: ['tema-a'], status: 'utkast' }),
      fråga('Annat tema?', { themes: ['tema-b'] }),
    ]
    // Svensk order: Ä sorterar efter V, inte som A.
    expect(fragorForTema('tema-a', alla).map((f) => f.text)).toEqual([
      'Vad är sant?',
      'Är detta viktigt?',
    ])
  })
})

describe('kallorForFraga', () => {
  const source = (id: string, status: Source['status'] = 'publicerad'): Source => ({
    id,
    slug: id,
    title: id,
    type: 'bok',
    rights: 'public-domain',
    status,
  })

  it('härleder unika publicerade sources ur frågans rum', () => {
    const alla = [
      rum('första', 'publicerad', {
        primaryQuestion: 'fraga-a',
        sources: [{ source: 'kalla-a', use: 'bearbetning', primary: true }],
      }),
      rum('andra', 'publicerad', {
        primaryQuestion: 'fraga-a',
        sources: [
          { source: 'kalla-a', use: 'citat', primary: true },
          { source: 'kalla-b', use: 'historisk-kontext', primary: false },
        ],
      }),
      rum('ovidkommande', 'publicerad', {
        primaryQuestion: 'fraga-b',
        sources: [{ source: 'kalla-c', use: 'citat', primary: true }],
      }),
    ]
    const sources = [source('kalla-a'), source('kalla-b'), source('kalla-c')]
    expect(kallorForFraga('fraga-a', alla, sources).map((k) => k.id)).toEqual([
      'kalla-a',
      'kalla-b',
    ])
  })
})

describe('publiceradeVia', () => {
  it('slår upp id och behåller bara publicerade träffar', () => {
    const poster = new Map([
      ['tema-a', tema('a')],
      ['tema-b', tema('b', { status: 'utkast' })],
    ])
    const träffar = publiceradeVia(['tema-a', 'tema-b', 'tema-saknas'], (id) => poster.get(id))
    expect(träffar.map((t) => t.label)).toEqual(['a'])
  })
})

describe('rumForKalla', () => {
  const relation = (source: string, primary: boolean) => ({
    source,
    use: 'bearbetning' as const,
    primary,
  })

  it('hittar publicerade rum med källan, primary relation först', () => {
    const alla = [
      rum('annan source', 'publicerad', { sources: [relation('kalla-b', true)] }),
      rum('bygger på källan', 'publicerad', { sources: [relation('kalla-a', false)] }),
      rum('utkast med källan', 'utkast', { sources: [relation('kalla-a', true)] }),
      rum('vilar på källan', 'publicerad', { sources: [relation('kalla-a', true)] }),
      rum('andrahandsbruk', 'publicerad', { sources: [relation('kalla-a', false)] }),
    ]
    expect(rumForKalla('kalla-a', alla).map((r) => r.title)).toEqual([
      'vilar på källan',
      'andrahandsbruk',
      'bygger på källan',
    ])
  })
})

describe('bibliotekTraditioner', () => {
  const tradition = (name: string, status: Tradition['status'] = 'publicerad'): Tradition => ({
    id: `tradition-${name}`,
    slug: name,
    name,
    status,
  })

  it('släpper bara igenom publicerade traditions, i svensk namnordning', () => {
    const alla = [tradition('stoicism'), tradition('buddhism'), tradition('taoism', 'utkast')]
    expect(bibliotekTraditioner(alla).map((t) => t.name)).toEqual(['buddhism', 'stoicism'])
  })
})

const vandring = (title: string, över: Partial<Path> = {}): Path => ({
  id: `vandring-${title}`,
  slug: title,
  title,
  introduction: 'x',
  centralQuestion: 'fraga-x',
  rum: ['rum-a', 'rum-b', 'rum-c'],
  status: 'publicerad',
  created: '2026-07-12',
  updated: '2026-07-12',
  ...över,
})

describe('bibliotekVandringar', () => {
  it('släpper bara igenom publicerade vandringar, i svensk titelordning', () => {
    const alla = [
      vandring('över tröskeln'),
      vandring('att vandra'),
      vandring('utkastet', { status: 'utkast' }),
      vandring('arkivet', { status: 'arkiverad' }),
    ]
    expect(bibliotekVandringar(alla).map((v) => v.title)).toEqual(['att vandra', 'över tröskeln'])
  })
})

describe('rumForVandring', () => {
  it('följer den redaktionella ordningen i rum-listan, inte titelordning', () => {
    const alla = [
      rum('sist', 'publicerad', { id: 'rum-c' }),
      rum('först', 'publicerad', { id: 'rum-a' }),
      rum('mitten', 'publicerad', { id: 'rum-b' }),
    ]
    const v = vandring('v', { rum: ['rum-a', 'rum-b', 'rum-c'] })
    expect(rumForVandring(v, alla).map((r) => r.title)).toEqual(['först', 'mitten', 'sist'])
  })

  it('behåller opublicerade rum — granskningsvyn ska gå att vandra', () => {
    const alla = [
      rum('publikt', 'publicerad', { id: 'rum-a' }),
      rum('utkast', 'utkast', { id: 'rum-b' }),
    ]
    const v = vandring('v', { rum: ['rum-a', 'rum-b'] })
    expect(rumForVandring(v, alla).map((r) => r.title)).toEqual(['publikt', 'utkast'])
  })

  it('hoppar tyst över id som saknar rum', () => {
    const alla = [rum('finns', 'publicerad', { id: 'rum-a' })]
    const v = vandring('v', { rum: ['rum-a', 'rum-saknas'] })
    expect(rumForVandring(v, alla).map((r) => r.title)).toEqual(['finns'])
  })
})

describe('vandringLastid', () => {
  it('summerar rummens lästid', () => {
    const rummen = [
      rum('a', 'publicerad', { readingTimeMinutes: 4 }),
      rum('b', 'publicerad', { readingTimeMinutes: 3 }),
      rum('c', 'publicerad', { readingTimeMinutes: 3 }),
    ]
    expect(vandringLastid(rummen)).toBe(10)
  })
})

describe('traditionerForVandring', () => {
  const source = (id: string, traditions: string[]): Source => ({
    id,
    slug: id,
    title: id,
    type: 'bok',
    rights: 'public-domain',
    traditions,
    status: 'publicerad',
  })
  const tradition = (name: string, status: Tradition['status'] = 'publicerad'): Tradition => ({
    id: `tradition-${name}`,
    slug: name,
    name,
    status,
  })

  it('härleder unika publicerade traditions ur rummens sources, i svensk order', () => {
    const rummen = [
      rum('ett', 'publicerad', { sources: [{ source: 'kalla-a', use: 'bearbetning', primary: true }] }),
      rum('två', 'publicerad', { sources: [{ source: 'kalla-b', use: 'citat', primary: true }] }),
    ]
    const sources = [
      source('kalla-a', ['tradition-stoicism']),
      source('kalla-b', ['tradition-buddhism', 'tradition-taoism']),
    ]
    const traditions = [
      tradition('stoicism'),
      tradition('buddhism'),
      tradition('taoism', 'utkast'),
    ]
    // taoism är utkast och faller bort; stoicism och buddhism i svensk order.
    expect(traditionerForVandring(rummen, sources, traditions).map((t) => t.name)).toEqual([
      'buddhism',
      'stoicism',
    ])
  })
})

describe('passagerForKalla', () => {
  const passage = (reference: string, över: Partial<SourcePassage> = {}): SourcePassage => ({
    id: `passage-${reference}`,
    source: 'kalla-a',
    reference,
    status: 'publicerad',
    ...över,
  })

  it('ger källans publicerade passager i naturlig referensordning', () => {
    const passager = [
      passage('avsnitt 43'),
      passage('avsnitt 5'),
      passage('avsnitt 1'),
      passage('avsnitt 8'),
    ]
    expect(passagerForKalla('kalla-a', passager).map((p) => p.reference)).toEqual([
      'avsnitt 1',
      'avsnitt 5',
      'avsnitt 8',
      'avsnitt 43',
    ])
  })

  it('utesluter utkastpassager och andra källors passager', () => {
    const passager = [
      passage('avsnitt 1'),
      passage('avsnitt 2', { status: 'granskning' }),
      passage('avsnitt 3', { source: 'kalla-b' }),
    ]
    expect(passagerForKalla('kalla-a', passager).map((p) => p.reference)).toEqual(['avsnitt 1'])
  })
})
