import { describe, expect, it } from 'vitest'
import type { Question, Source, SourcePassage, Room, Theme, Tradition, Path } from '../content/editorial/schema'
import {
  libraryRooms,
  libraryThemes,
  libraryTraditions,
  libraryPaths,
  questionsForTheme,
  sourcesForQuestion,
  passagesForSource,
  publishedThrough,
  roomsForQuestion,
  roomsForSource,
  roomsForPath,
  traditionsForPath,
  pathReadingTime,
} from './library'

// Fabricerade poster: bara fälten biblioteket läser behöver vara meningsfulla.
const room = (title: string, status: Room['status'] = 'published', över: Partial<Room> = {}): Room => ({
  id: `rum-${title}`,
  slug: title,
  title,
  summary: 'x',
  primaryQuestion: 'fraga-x',
  themes: ['tema-x'],
  thoughtToCarry: 'x',
  reflectionQuestions: ['x?'],
  sources: [{ source: 'kalla-x', use: 'adaptation', primary: true }],
  readingTimeMinutes: 4,
  language: 'sv',
  status,
  created: '2026-07-12',
  updated: '2026-07-12',
  opening: 'x',
  core: 'x',
  ...över,
})

const theme = (
  label: string,
  extra: Partial<Pick<Theme, 'status' | 'order'>> = {},
): Theme => ({
  id: `tema-${label}`,
  slug: label,
  label,
  status: 'published',
  ...extra,
})

describe('libraryThemes', () => {
  it('släpper bara igenom publicerade teman — utkast hör inte hemma i biblioteket', () => {
    const themes = [
      theme('lugn'),
      theme('mod', { status: 'draft' }),
      theme('sanning', { status: 'review' }),
      theme('mening', { status: 'archived' }),
    ]
    expect(libraryThemes(themes).map((t) => t.label)).toEqual(['lugn'])
  })

  it('följer redaktionell ordning och därefter svensk etikettordning', () => {
    const themes = [
      theme('österlandet'),
      theme('ande'),
      theme('mening', { order: 2 }),
      theme('lugn', { order: 1 }),
    ]
    // Ordnade themes först; oordnade sist i svensk order (ö efter a).
    expect(libraryThemes(themes).map((t) => t.label)).toEqual([
      'lugn',
      'mening',
      'ande',
      'österlandet',
    ])
  })
})

describe('libraryRooms', () => {
  it('släpper bara igenom publicerade rum, i svensk titelordning', () => {
    const all = [
      room('över tröskeln'),
      room('att vänta'),
      room('utkastet', 'draft'),
      room('granskningen', 'review'),
      room('arkivet', 'archived'),
    ]
    expect(libraryRooms(all).map((r) => r.title)).toEqual(['att vänta', 'över tröskeln'])
  })
})

const question = (text: string, över: Partial<Question> = {}): Question => ({
  id: `fraga-${text}`,
  slug: text,
  text,
  themes: ['tema-x'],
  status: 'published',
  ...över,
})

describe('roomsForQuestion', () => {
  it('sätter rum med frågan som primär först, sedan relaterade — bara publicerade', () => {
    const all = [
      room('önskan', 'published', { primaryQuestion: 'fraga-b', relatedQuestions: ['fraga-a'] }),
      room('besked', 'published', { primaryQuestion: 'fraga-a' }),
      room('utkastet', 'draft', { primaryQuestion: 'fraga-a' }),
      room('other', 'published', { primaryQuestion: 'fraga-b' }),
      room('avstånd', 'published', { primaryQuestion: 'fraga-a' }),
    ]
    expect(roomsForQuestion('fraga-a', all).map((r) => r.title)).toEqual([
      'avstånd',
      'besked',
      'önskan',
    ])
  })

  it('räknar inte samma rum två gånger när frågan är både primär och relaterad', () => {
    const all = [
      room('dubblerat', 'published', { primaryQuestion: 'fraga-a', relatedQuestions: ['fraga-a'] }),
    ]
    expect(roomsForQuestion('fraga-a', all).map((r) => r.title)).toEqual(['dubblerat'])
  })
})

describe('questionsForTheme', () => {
  it('släpper bara igenom publicerade frågor taggade med temat, i svensk ordning', () => {
    const all = [
      question('Vad är sant?', { themes: ['tema-a'] }),
      question('Är detta viktigt?', { themes: ['tema-a'] }),
      question('Utkastfråga?', { themes: ['tema-a'], status: 'draft' }),
      question('Annat tema?', { themes: ['tema-b'] }),
    ]
    // Svensk order: Ä sorterar efter V, inte som A.
    expect(questionsForTheme('tema-a', all).map((f) => f.text)).toEqual([
      'Vad är sant?',
      'Är detta viktigt?',
    ])
  })
})

describe('sourcesForQuestion', () => {
  const source = (id: string, status: Source['status'] = 'published'): Source => ({
    id,
    slug: id,
    title: id,
    type: 'book',
    rights: 'public-domain',
    status,
  })

  it('härleder unika publicerade källor ur frågans rum', () => {
    const all = [
      room('första', 'published', {
        primaryQuestion: 'fraga-a',
        sources: [{ source: 'kalla-a', use: 'adaptation', primary: true }],
      }),
      room('andra', 'published', {
        primaryQuestion: 'fraga-a',
        sources: [
          { source: 'kalla-a', use: 'quote', primary: true },
          { source: 'kalla-b', use: 'historical-context', primary: false },
        ],
      }),
      room('ovidkommande', 'published', {
        primaryQuestion: 'fraga-b',
        sources: [{ source: 'kalla-c', use: 'quote', primary: true }],
      }),
    ]
    const sources = [source('kalla-a'), source('kalla-b'), source('kalla-c')]
    expect(sourcesForQuestion('fraga-a', all, sources).map((k) => k.id)).toEqual([
      'kalla-a',
      'kalla-b',
    ])
  })
})

describe('publiceradeVia', () => {
  it('slår upp id och behåller bara publicerade träffar', () => {
    const items = new Map([
      ['tema-a', theme('a')],
      ['tema-b', theme('b', { status: 'draft' })],
    ])
    const hits = publishedThrough(['tema-a', 'tema-b', 'tema-saknas'], (id) => items.get(id))
    expect(hits.map((t) => t.label)).toEqual(['a'])
  })
})

describe('roomsForSource', () => {
  const relation = (source: string, primary: boolean) => ({
    source,
    use: 'adaptation' as const,
    primary,
  })

  it('hittar publicerade rum med källan, primär relation först', () => {
    const all = [
      room('annan source', 'published', { sources: [relation('kalla-b', true)] }),
      room('bygger på källan', 'published', { sources: [relation('kalla-a', false)] }),
      room('utkast med källan', 'draft', { sources: [relation('kalla-a', true)] }),
      room('vilar på källan', 'published', { sources: [relation('kalla-a', true)] }),
      room('andrahandsbruk', 'published', { sources: [relation('kalla-a', false)] }),
    ]
    expect(roomsForSource('kalla-a', all).map((r) => r.title)).toEqual([
      'vilar på källan',
      'andrahandsbruk',
      'bygger på källan',
    ])
  })
})

describe('libraryTraditions', () => {
  const tradition = (name: string, status: Tradition['status'] = 'published'): Tradition => ({
    id: `tradition-${name}`,
    slug: name,
    name,
    status,
  })

  it('släpper bara igenom publicerade traditioner, i svensk namnordning', () => {
    const all = [tradition('stoicism'), tradition('buddhism'), tradition('taoism', 'draft')]
    expect(libraryTraditions(all).map((t) => t.name)).toEqual(['buddhism', 'stoicism'])
  })
})

const path = (title: string, över: Partial<Path> = {}): Path => ({
  id: `vandring-${title}`,
  slug: title,
  title,
  introduction: 'x',
  centralQuestion: 'fraga-x',
  rooms: ['rum-a', 'rum-b', 'rum-c'],
  status: 'published',
  created: '2026-07-12',
  updated: '2026-07-12',
  ...över,
})

describe('libraryPaths', () => {
  it('släpper bara igenom publicerade vandringar, i svensk titelordning', () => {
    const all = [
      path('över tröskeln'),
      path('att vandra'),
      path('utkastet', { status: 'draft' }),
      path('arkivet', { status: 'archived' }),
    ]
    expect(libraryPaths(all).map((v) => v.title)).toEqual(['att vandra', 'över tröskeln'])
  })
})

describe('roomsForPath', () => {
  it('följer den redaktionella ordningen i rum-listan, inte titelordning', () => {
    const all = [
      room('sist', 'published', { id: 'rum-c' }),
      room('först', 'published', { id: 'rum-a' }),
      room('mitten', 'published', { id: 'rum-b' }),
    ]
    const v = path('v', { rooms: ['rum-a', 'rum-b', 'rum-c'] })
    expect(roomsForPath(v, all).map((r) => r.title)).toEqual(['först', 'mitten', 'sist'])
  })

  it('behåller opublicerade rum — granskningsvyn ska gå att vandra', () => {
    const all = [
      room('publikt', 'published', { id: 'rum-a' }),
      room('draft', 'draft', { id: 'rum-b' }),
    ]
    const v = path('v', { rooms: ['rum-a', 'rum-b'] })
    expect(roomsForPath(v, all).map((r) => r.title)).toEqual(['publikt', 'draft'])
  })

  it('hoppar tyst över id som saknar rum', () => {
    const all = [room('finns', 'published', { id: 'rum-a' })]
    const v = path('v', { rooms: ['rum-a', 'rum-saknas'] })
    expect(roomsForPath(v, all).map((r) => r.title)).toEqual(['finns'])
  })
})

describe('pathReadingTime', () => {
  it('summerar rummens lästid', () => {
    const rooms = [
      room('a', 'published', { readingTimeMinutes: 4 }),
      room('b', 'published', { readingTimeMinutes: 3 }),
      room('c', 'published', { readingTimeMinutes: 3 }),
    ]
    expect(pathReadingTime(rooms)).toBe(10)
  })
})

describe('traditionsForPath', () => {
  const source = (id: string, traditions: string[]): Source => ({
    id,
    slug: id,
    title: id,
    type: 'book',
    rights: 'public-domain',
    traditions,
    status: 'published',
  })
  const tradition = (name: string, status: Tradition['status'] = 'published'): Tradition => ({
    id: `tradition-${name}`,
    slug: name,
    name,
    status,
  })

  it('härleder unika publicerade traditioner ur rummens källor, i svensk ordning', () => {
    const rooms = [
      room('ett', 'published', { sources: [{ source: 'kalla-a', use: 'adaptation', primary: true }] }),
      room('två', 'published', { sources: [{ source: 'kalla-b', use: 'quote', primary: true }] }),
    ]
    const sources = [
      source('kalla-a', ['tradition-stoicism']),
      source('kalla-b', ['tradition-buddhism', 'tradition-taoism']),
    ]
    const traditions = [
      tradition('stoicism'),
      tradition('buddhism'),
      tradition('taoism', 'draft'),
    ]
    // taoism är utkast och faller bort; stoicism och buddhism i svensk order.
    expect(traditionsForPath(rooms, sources, traditions).map((t) => t.name)).toEqual([
      'buddhism',
      'stoicism',
    ])
  })
})

describe('passagesForSource', () => {
  const passage = (reference: string, över: Partial<SourcePassage> = {}): SourcePassage => ({
    id: `passage-${reference}`,
    source: 'kalla-a',
    reference,
    status: 'published',
    ...över,
  })

  it('ger källans publicerade passager i naturlig referensordning', () => {
    const passager = [
      passage('avsnitt 43'),
      passage('avsnitt 5'),
      passage('avsnitt 1'),
      passage('avsnitt 8'),
    ]
    expect(passagesForSource('kalla-a', passager).map((p) => p.reference)).toEqual([
      'avsnitt 1',
      'avsnitt 5',
      'avsnitt 8',
      'avsnitt 43',
    ])
  })

  it('utesluter utkastpassager och andra källors passager', () => {
    const passager = [
      passage('avsnitt 1'),
      passage('avsnitt 2', { status: 'review' }),
      passage('avsnitt 3', { source: 'kalla-b' }),
    ]
    expect(passagesForSource('kalla-a', passager).map((p) => p.reference)).toEqual(['avsnitt 1'])
  })
})
