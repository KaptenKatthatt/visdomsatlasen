import { describe, expect, it } from 'vitest'
import type { Fraga, Innehallsmangd, Kalla, Rum, Tema } from './schema'
import { valideraInnehall } from './validera'

const rum = (över: Partial<Rum> = {}): Rum => ({
  id: 'rum-a',
  slug: 'rum-a',
  titel: 'Rum A',
  sammanfattning: 'Sammanfattning.',
  primärFråga: 'fraga-a',
  teman: ['tema-a'],
  tankeAttBära: 'En tanke.',
  reflektionsfrågor: ['En fråga?'],
  källor: [{ källa: 'kalla-a', bruk: 'bearbetning', primär: true }],
  lästidMinuter: 4,
  språk: 'sv',
  status: 'utkast',
  skapad: '2026-07-09',
  uppdaterad: '2026-07-09',
  öppning: 'Öppning.',
  kärna: 'Kärna.',
  ...över,
})

const tema = (över: Partial<Tema> = {}): Tema => ({
  id: 'tema-a',
  slug: 'tema-a',
  etikett: 'Tema A',
  status: 'publicerad',
  ...över,
})

const fråga = (över: Partial<Fraga> = {}): Fraga => ({
  id: 'fraga-a',
  slug: 'fraga-a',
  text: 'Vad är A?',
  teman: ['tema-a'],
  status: 'publicerad',
  ...över,
})

const källa = (över: Partial<Kalla> = {}): Kalla => ({
  id: 'kalla-a',
  slug: 'kalla-a',
  titel: 'Källa A',
  typ: 'bok',
  rättigheter: 'public-domain',
  status: 'publicerad',
  ...över,
})

const grund = (över: Partial<Innehallsmangd> = {}): Innehallsmangd => ({
  rum: [rum()],
  teman: [tema()],
  frågor: [fråga()],
  vandringar: [],
  källor: [källa()],
  passager: [],
  traditioner: [],
  personer: [],
  ...över,
})

describe('valideraInnehall', () => {
  it('godkänner en konsistent innehållsmängd', () => {
    expect(valideraInnehall(grund())).toEqual([])
  })

  it('fångar dubblerade id och sluggar inom en samling', () => {
    const fel = valideraInnehall(grund({ teman: [tema(), tema({ etikett: 'Kopia' })] }))
    expect(fel.some((f) => f.includes('tema-a') && f.includes('dubblett'))).toBe(true)
  })

  it('fångar rum vars primära fråga inte finns', () => {
    const fel = valideraInnehall(grund({ rum: [rum({ primärFråga: 'saknas' })] }))
    expect(fel.some((f) => f.includes('rum-a') && f.includes('saknas'))).toBe(true)
  })

  it('fångar rum med okänt tema och okänd källa', () => {
    const fel = valideraInnehall(
      grund({
        rum: [
          rum({
            teman: ['tema-x'],
            källor: [{ källa: 'kalla-x', bruk: 'bearbetning', primär: true }],
          }),
        ],
      }),
    )
    expect(fel.some((f) => f.includes('tema-x'))).toBe(true)
    expect(fel.some((f) => f.includes('kalla-x'))).toBe(true)
  })

  it('kräver primär källa för publicerade rum men inte för utkast', () => {
    const utanPrimär = [{ källa: 'kalla-a', bruk: 'bearbetning' as const, primär: false }]
    const utkast = valideraInnehall(grund({ rum: [rum({ källor: utanPrimär })] }))
    expect(utkast).toEqual([])
    const publicerat = valideraInnehall(
      grund({ rum: [rum({ status: 'publicerad', källor: utanPrimär })] }),
    )
    expect(publicerat.some((f) => f.includes('primär källa'))).toBe(true)
  })

  it('hindrar publicerade rum från att länka opublicerat innehåll', () => {
    const fel = valideraInnehall(
      grund({
        rum: [rum({ status: 'publicerad' })],
        frågor: [fråga({ status: 'utkast' })],
        källor: [källa({ status: 'granskning' })],
      }),
    )
    expect(fel.some((f) => f.includes('fraga-a') && f.includes('opublicerad'))).toBe(true)
    expect(fel.some((f) => f.includes('kalla-a') && f.includes('opublicerad'))).toBe(true)
  })

  it('hindrar publicerade rum från att länka opublicerade källpassager', () => {
    const medPassage = [
      { källa: 'kalla-a', passage: 'passage-a', bruk: 'citat' as const, primär: true },
    ]
    const passagen = { id: 'passage-a', källa: 'kalla-a', referens: 'avsnitt 1' }
    const utkastPassage = valideraInnehall(
      grund({
        rum: [rum({ status: 'publicerad', källor: medPassage })],
        passager: [{ ...passagen, status: 'utkast' }],
      }),
    )
    expect(
      utkastPassage.some((f) => f.includes('passage-a') && f.includes('opublicerad')),
    ).toBe(true)
    const publiceradPassage = valideraInnehall(
      grund({
        rum: [rum({ status: 'publicerad', källor: medPassage })],
        passager: [{ ...passagen, status: 'publicerad' }],
      }),
    )
    expect(publiceradPassage).toEqual([])
  })

  it('begränsar lästiden för publicerade rum till 1–10 minuter', () => {
    const fel = valideraInnehall(
      grund({ rum: [rum({ status: 'publicerad', lästidMinuter: 12 })] }),
    )
    expect(fel.some((f) => f.includes('lästid'))).toBe(true)
    expect(valideraInnehall(grund({ rum: [rum({ lästidMinuter: 12 })] }))).toEqual([])
  })

  it('kräver att temats standardrum finns och tillhör temat', () => {
    const okänt = valideraInnehall(grund({ teman: [tema({ standardRum: 'rum-x' })] }))
    expect(okänt.some((f) => f.includes('rum-x'))).toBe(true)
    const felTema = valideraInnehall(
      grund({
        teman: [tema(), tema({ id: 'tema-b', slug: 'tema-b', standardRum: 'rum-a' })],
      }),
    )
    expect(felTema.some((f) => f.includes('tema-b') && f.includes('tillhör'))).toBe(true)
  })

  it('kräver publicerat standardrum för publicerade teman', () => {
    const fel = valideraInnehall(grund({ teman: [tema({ standardRum: 'rum-a' })] }))
    expect(fel.some((f) => f.includes('opublicer'))).toBe(true)
  })

  it('fångar brutna relationer från frågor, vandringar och passager', () => {
    const fel = valideraInnehall(
      grund({
        frågor: [fråga({ teman: ['tema-x'], relateradeFrågor: ['fraga-x'] })],
        vandringar: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            titel: 'Vandring A',
            introduktion: 'Intro.',
            centralFråga: 'fraga-x',
            rum: ['rum-a', 'rum-x', 'rum-y'],
            status: 'utkast',
            skapad: '2026-07-09',
            uppdaterad: '2026-07-09',
          },
        ],
        passager: [
          { id: 'passage-a', källa: 'kalla-x', referens: 'avsnitt 1', status: 'utkast' },
        ],
      }),
    )
    expect(fel.some((f) => f.includes('fraga-a') && f.includes('tema-x'))).toBe(true)
    expect(fel.some((f) => f.includes('fraga-a') && f.includes('fraga-x'))).toBe(true)
    expect(fel.some((f) => f.includes('vandring-a') && f.includes('rum-x'))).toBe(true)
    expect(fel.some((f) => f.includes('passage-a') && f.includes('kalla-x'))).toBe(true)
  })

  it('hindrar publicerade frågor från att länka opublicerade teman och frågor', () => {
    // Frågan är publicerad men temat den pekar på (tema-a) är utkast.
    const opubliceratTema = valideraInnehall(
      grund({
        rum: [rum({ teman: ['tema-b'] })],
        teman: [tema({ status: 'utkast' }), tema({ id: 'tema-b', slug: 'tema-b' })],
      }),
    )
    expect(
      opubliceratTema.some((f) => f.includes('fraga-a') && f.includes('opublicerad(t) tema')),
    ).toBe(true)
    const opubliceradRelaterad = valideraInnehall(
      grund({
        frågor: [
          fråga({ relateradeFrågor: ['fraga-b'] }),
          fråga({ id: 'fraga-b', slug: 'fraga-b', status: 'utkast' }),
        ],
      }),
    )
    expect(
      opubliceradRelaterad.some(
        (f) => f.includes('fraga-a') && f.includes('opublicerad(t) relaterad fråga'),
      ),
    ).toBe(true)
    // Utkastfrågor är fria att peka på opublicerat.
    const utkastfråga = valideraInnehall(
      grund({
        rum: [rum({ teman: ['tema-a'], primärFråga: 'fraga-a' })],
        teman: [tema(), tema({ id: 'tema-b', slug: 'tema-b', status: 'utkast' })],
        frågor: [fråga({ status: 'utkast', teman: ['tema-b'] })],
      }),
    )
    expect(utkastfråga).toEqual([])
  })

  it('kräver att källors traditioner finns och hindrar publicerad källa från att länka opublicerad tradition', () => {
    const traditionen = { id: 'tradition-a', slug: 'tradition-a', namn: 'Tradition A' }
    const okänd = valideraInnehall(
      grund({ källor: [källa({ traditioner: ['tradition-x'] })] }),
    )
    expect(okänd.some((f) => f.includes('kalla-a') && f.includes('tradition-x'))).toBe(true)
    const opublicerad = valideraInnehall(
      grund({
        källor: [källa({ traditioner: ['tradition-a'] })],
        traditioner: [{ ...traditionen, status: 'utkast' }],
      }),
    )
    expect(
      opublicerad.some((f) => f.includes('kalla-a') && f.includes('opublicerad tradition')),
    ).toBe(true)
    const publicerad = valideraInnehall(
      grund({
        källor: [källa({ traditioner: ['tradition-a'] })],
        traditioner: [{ ...traditionen, status: 'publicerad' }],
      }),
    )
    expect(publicerad).toEqual([])
    // Utkastkällor är fria — grinden gäller bara publicerat.
    const utkastkälla = valideraInnehall(
      grund({
        rum: [rum({ källor: [{ källa: 'kalla-b', bruk: 'bearbetning', primär: true }] })],
        källor: [
          källa({ id: 'kalla-b', slug: 'kalla-b' }),
          källa({ status: 'utkast', traditioner: ['tradition-a'] }),
        ],
        traditioner: [{ ...traditionen, status: 'utkast' }],
      }),
    )
    expect(utkastkälla).toEqual([])
  })

  it('hindrar publicerade vandringar från att innehålla opublicerade rum', () => {
    const fel = valideraInnehall(
      grund({
        rum: [rum(), rum({ id: 'rum-b', slug: 'rum-b' }), rum({ id: 'rum-c', slug: 'rum-c' })],
        vandringar: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            titel: 'Vandring A',
            introduktion: 'Intro.',
            centralFråga: 'fraga-a',
            rum: ['rum-a', 'rum-b', 'rum-c'],
            status: 'publicerad',
            skapad: '2026-07-09',
            uppdaterad: '2026-07-09',
          },
        ],
      }),
    )
    expect(fel.some((f) => f.includes('vandring-a') && f.includes('opublicer'))).toBe(true)
  })
})
