import { describe, expect, it } from 'vitest'
import type { Fraga, Kalla, Rum, Tema, Tradition, Vandring } from '../content/redaktion/schema'
import {
  bibliotekRum,
  bibliotekTeman,
  bibliotekTraditioner,
  bibliotekVandringar,
  fragorForTema,
  kallorForFraga,
  publiceradeVia,
  rumForFraga,
  rumForKalla,
  rumForVandring,
  traditionerForVandring,
  vandringLastid,
} from './bibliotek'

// Fabricerade poster: bara fälten biblioteket läser behöver vara meningsfulla.
const rum = (titel: string, status: Rum['status'] = 'publicerad', över: Partial<Rum> = {}): Rum => ({
  id: `rum-${titel}`,
  slug: titel,
  titel,
  sammanfattning: 'x',
  primärFråga: 'fraga-x',
  teman: ['tema-x'],
  tankeAttBära: 'x',
  reflektionsfrågor: ['x?'],
  källor: [{ källa: 'kalla-x', bruk: 'bearbetning', primär: true }],
  lästidMinuter: 4,
  språk: 'sv',
  status,
  skapad: '2026-07-12',
  uppdaterad: '2026-07-12',
  öppning: 'x',
  kärna: 'x',
  ...över,
})

const tema = (
  etikett: string,
  extra: Partial<Pick<Tema, 'status' | 'ordning'>> = {},
): Tema => ({
  id: `tema-${etikett}`,
  slug: etikett,
  etikett,
  status: 'publicerad',
  ...extra,
})

describe('bibliotekTeman', () => {
  it('släpper bara igenom publicerade teman — utkast hör inte hemma i biblioteket', () => {
    const teman = [
      tema('lugn'),
      tema('mod', { status: 'utkast' }),
      tema('sanning', { status: 'granskning' }),
      tema('mening', { status: 'arkiverad' }),
    ]
    expect(bibliotekTeman(teman).map((t) => t.etikett)).toEqual(['lugn'])
  })

  it('följer redaktionell ordning och därefter svensk etikettordning', () => {
    const teman = [
      tema('österlandet'),
      tema('ande'),
      tema('mening', { ordning: 2 }),
      tema('lugn', { ordning: 1 }),
    ]
    // Ordnade teman först; oordnade sist i svensk ordning (ö efter a).
    expect(bibliotekTeman(teman).map((t) => t.etikett)).toEqual([
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
    expect(bibliotekRum(alla).map((r) => r.titel)).toEqual(['att vänta', 'över tröskeln'])
  })
})

const fråga = (text: string, över: Partial<Fraga> = {}): Fraga => ({
  id: `fraga-${text}`,
  slug: text,
  text,
  teman: ['tema-x'],
  status: 'publicerad',
  ...över,
})

describe('rumForFraga', () => {
  it('sätter rum med frågan som primär först, sedan relaterade — bara publicerade', () => {
    const alla = [
      rum('önskan', 'publicerad', { primärFråga: 'fraga-b', relateradeFrågor: ['fraga-a'] }),
      rum('besked', 'publicerad', { primärFråga: 'fraga-a' }),
      rum('utkastet', 'utkast', { primärFråga: 'fraga-a' }),
      rum('annat', 'publicerad', { primärFråga: 'fraga-b' }),
      rum('avstånd', 'publicerad', { primärFråga: 'fraga-a' }),
    ]
    expect(rumForFraga('fraga-a', alla).map((r) => r.titel)).toEqual([
      'avstånd',
      'besked',
      'önskan',
    ])
  })

  it('räknar inte samma rum två gånger när frågan är både primär och relaterad', () => {
    const alla = [
      rum('dubblerat', 'publicerad', { primärFråga: 'fraga-a', relateradeFrågor: ['fraga-a'] }),
    ]
    expect(rumForFraga('fraga-a', alla).map((r) => r.titel)).toEqual(['dubblerat'])
  })
})

describe('fragorForTema', () => {
  it('släpper bara igenom publicerade frågor taggade med temat, i svensk ordning', () => {
    const alla = [
      fråga('Vad är sant?', { teman: ['tema-a'] }),
      fråga('Är detta viktigt?', { teman: ['tema-a'] }),
      fråga('Utkastfråga?', { teman: ['tema-a'], status: 'utkast' }),
      fråga('Annat tema?', { teman: ['tema-b'] }),
    ]
    // Svensk ordning: Ä sorterar efter V, inte som A.
    expect(fragorForTema('tema-a', alla).map((f) => f.text)).toEqual([
      'Vad är sant?',
      'Är detta viktigt?',
    ])
  })
})

describe('kallorForFraga', () => {
  const källa = (id: string, status: Kalla['status'] = 'publicerad'): Kalla => ({
    id,
    slug: id,
    titel: id,
    typ: 'bok',
    rättigheter: 'public-domain',
    status,
  })

  it('härleder unika publicerade källor ur frågans rum', () => {
    const alla = [
      rum('första', 'publicerad', {
        primärFråga: 'fraga-a',
        källor: [{ källa: 'kalla-a', bruk: 'bearbetning', primär: true }],
      }),
      rum('andra', 'publicerad', {
        primärFråga: 'fraga-a',
        källor: [
          { källa: 'kalla-a', bruk: 'citat', primär: true },
          { källa: 'kalla-b', bruk: 'historisk-kontext', primär: false },
        ],
      }),
      rum('ovidkommande', 'publicerad', {
        primärFråga: 'fraga-b',
        källor: [{ källa: 'kalla-c', bruk: 'citat', primär: true }],
      }),
    ]
    const källor = [källa('kalla-a'), källa('kalla-b'), källa('kalla-c')]
    expect(kallorForFraga('fraga-a', alla, källor).map((k) => k.id)).toEqual([
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
    expect(träffar.map((t) => t.etikett)).toEqual(['a'])
  })
})

describe('rumForKalla', () => {
  const relation = (källa: string, primär: boolean) => ({
    källa,
    bruk: 'bearbetning' as const,
    primär,
  })

  it('hittar publicerade rum med källan, primär relation först', () => {
    const alla = [
      rum('annan källa', 'publicerad', { källor: [relation('kalla-b', true)] }),
      rum('bygger på källan', 'publicerad', { källor: [relation('kalla-a', false)] }),
      rum('utkast med källan', 'utkast', { källor: [relation('kalla-a', true)] }),
      rum('vilar på källan', 'publicerad', { källor: [relation('kalla-a', true)] }),
      rum('andrahandsbruk', 'publicerad', { källor: [relation('kalla-a', false)] }),
    ]
    expect(rumForKalla('kalla-a', alla).map((r) => r.titel)).toEqual([
      'vilar på källan',
      'andrahandsbruk',
      'bygger på källan',
    ])
  })
})

describe('bibliotekTraditioner', () => {
  const tradition = (namn: string, status: Tradition['status'] = 'publicerad'): Tradition => ({
    id: `tradition-${namn}`,
    slug: namn,
    namn,
    status,
  })

  it('släpper bara igenom publicerade traditioner, i svensk namnordning', () => {
    const alla = [tradition('stoicism'), tradition('buddhism'), tradition('taoism', 'utkast')]
    expect(bibliotekTraditioner(alla).map((t) => t.namn)).toEqual(['buddhism', 'stoicism'])
  })
})

const vandring = (titel: string, över: Partial<Vandring> = {}): Vandring => ({
  id: `vandring-${titel}`,
  slug: titel,
  titel,
  introduktion: 'x',
  centralFråga: 'fraga-x',
  rum: ['rum-a', 'rum-b', 'rum-c'],
  status: 'publicerad',
  skapad: '2026-07-12',
  uppdaterad: '2026-07-12',
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
    expect(bibliotekVandringar(alla).map((v) => v.titel)).toEqual(['att vandra', 'över tröskeln'])
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
    expect(rumForVandring(v, alla).map((r) => r.titel)).toEqual(['först', 'mitten', 'sist'])
  })

  it('behåller opublicerade rum — granskningsvyn ska gå att vandra', () => {
    const alla = [
      rum('publikt', 'publicerad', { id: 'rum-a' }),
      rum('utkast', 'utkast', { id: 'rum-b' }),
    ]
    const v = vandring('v', { rum: ['rum-a', 'rum-b'] })
    expect(rumForVandring(v, alla).map((r) => r.titel)).toEqual(['publikt', 'utkast'])
  })

  it('hoppar tyst över id som saknar rum', () => {
    const alla = [rum('finns', 'publicerad', { id: 'rum-a' })]
    const v = vandring('v', { rum: ['rum-a', 'rum-saknas'] })
    expect(rumForVandring(v, alla).map((r) => r.titel)).toEqual(['finns'])
  })
})

describe('vandringLastid', () => {
  it('summerar rummens lästid', () => {
    const rummen = [
      rum('a', 'publicerad', { lästidMinuter: 4 }),
      rum('b', 'publicerad', { lästidMinuter: 3 }),
      rum('c', 'publicerad', { lästidMinuter: 3 }),
    ]
    expect(vandringLastid(rummen)).toBe(10)
  })
})

describe('traditionerForVandring', () => {
  const källa = (id: string, traditioner: string[]): Kalla => ({
    id,
    slug: id,
    titel: id,
    typ: 'bok',
    rättigheter: 'public-domain',
    traditioner,
    status: 'publicerad',
  })
  const tradition = (namn: string, status: Tradition['status'] = 'publicerad'): Tradition => ({
    id: `tradition-${namn}`,
    slug: namn,
    namn,
    status,
  })

  it('härleder unika publicerade traditioner ur rummens källor, i svensk ordning', () => {
    const rummen = [
      rum('ett', 'publicerad', { källor: [{ källa: 'kalla-a', bruk: 'bearbetning', primär: true }] }),
      rum('två', 'publicerad', { källor: [{ källa: 'kalla-b', bruk: 'citat', primär: true }] }),
    ]
    const källor = [
      källa('kalla-a', ['tradition-stoicism']),
      källa('kalla-b', ['tradition-buddhism', 'tradition-taoism']),
    ]
    const traditioner = [
      tradition('stoicism'),
      tradition('buddhism'),
      tradition('taoism', 'utkast'),
    ]
    // taoism är utkast och faller bort; stoicism och buddhism i svensk ordning.
    expect(traditionerForVandring(rummen, källor, traditioner).map((t) => t.namn)).toEqual([
      'buddhism',
      'stoicism',
    ])
  })
})
