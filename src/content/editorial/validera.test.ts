import { describe, expect, it } from 'vitest'
import type { Fraga, Innehallsmangd, Kalla, Kallpassage, Rum, Tema } from './schema'
import { valideraInnehall } from './validera'

const rum = (över: Partial<Rum> = {}): Rum => ({
  id: 'rum-a',
  slug: 'rum-a',
  title: 'Rum A',
  summary: 'Sammanfattning.',
  primaryQuestion: 'fraga-a',
  themes: ['tema-a'],
  thoughtToCarry: 'En tanke.',
  reflectionQuestions: ['En fråga?'],
  sources: [{ source: 'kalla-a', use: 'bearbetning', primary: true }],
  readingTimeMinutes: 4,
  language: 'sv',
  status: 'utkast',
  created: '2026-07-09',
  updated: '2026-07-09',
  opening: 'Öppning.',
  core: 'Kärna.',
  ...över,
})

const tema = (över: Partial<Tema> = {}): Tema => ({
  id: 'tema-a',
  slug: 'tema-a',
  label: 'Tema A',
  status: 'publicerad',
  ...över,
})

const fråga = (över: Partial<Fraga> = {}): Fraga => ({
  id: 'fraga-a',
  slug: 'fraga-a',
  text: 'Vad är A?',
  themes: ['tema-a'],
  status: 'publicerad',
  ...över,
})

const source = (över: Partial<Kalla> = {}): Kalla => ({
  id: 'kalla-a',
  slug: 'kalla-a',
  title: 'Källa A',
  type: 'bok',
  attribution: 'känt',
  dating: 'känd',
  rights: 'public-domain',
  status: 'publicerad',
  ...över,
})

const passage = (över: Partial<Kallpassage> = {}): Kallpassage => ({
  id: 'passage-a',
  source: 'kalla-a',
  reference: 'avsnitt 1',
  status: 'publicerad',
  ...över,
})

const grund = (över: Partial<Innehallsmangd> = {}): Innehallsmangd => ({
  rum: [rum()],
  themes: [tema()],
  frågor: [fråga()],
  vandringar: [],
  sources: [source()],
  passager: [],
  traditions: [],
  personer: [],
  ...över,
})

describe('valideraInnehall', () => {
  it('godkänner en konsistent innehållsmängd', () => {
    expect(valideraInnehall(grund())).toEqual([])
  })

  it('fångar dubblerade id och sluggar inom en samling', () => {
    const fel = valideraInnehall(grund({ themes: [tema(), tema({ label: 'Kopia' })] }))
    expect(fel.some((f) => f.includes('tema-a') && f.includes('dubblett'))).toBe(true)
  })

  it('fångar rum vars primära fråga inte finns', () => {
    const fel = valideraInnehall(grund({ rum: [rum({ primaryQuestion: 'saknas' })] }))
    expect(fel.some((f) => f.includes('rum-a') && f.includes('saknas'))).toBe(true)
  })

  it('fångar rum med okänt tema och okänd source', () => {
    const fel = valideraInnehall(
      grund({
        rum: [
          rum({
            themes: ['tema-x'],
            sources: [{ source: 'kalla-x', use: 'bearbetning', primary: true }],
          }),
        ],
      }),
    )
    expect(fel.some((f) => f.includes('tema-x'))).toBe(true)
    expect(fel.some((f) => f.includes('kalla-x'))).toBe(true)
  })

  it('kräver primary source för publicerade rum men inte för utkast', () => {
    const utanPrimär = [{ source: 'kalla-a', use: 'bearbetning' as const, primary: false }]
    const utkast = valideraInnehall(grund({ rum: [rum({ sources: utanPrimär })] }))
    expect(utkast).toEqual([])
    const publicerat = valideraInnehall(
      grund({ rum: [rum({ status: 'publicerad', sources: utanPrimär })] }),
    )
    expect(publicerat.some((f) => f.includes('primary source'))).toBe(true)
  })

  it('hindrar publicerade rum från att länka opublicerat innehåll', () => {
    const fel = valideraInnehall(
      grund({
        rum: [rum({ status: 'publicerad' })],
        frågor: [fråga({ status: 'utkast' })],
        sources: [source({ status: 'granskning' })],
      }),
    )
    expect(fel.some((f) => f.includes('fraga-a') && f.includes('opublicerad'))).toBe(true)
    expect(fel.some((f) => f.includes('kalla-a') && f.includes('opublicerad'))).toBe(true)
  })

  it('hindrar publicerade rum från att länka opublicerade källpassager', () => {
    const medPassage = [
      { source: 'kalla-a', passage: 'passage-a', use: 'citat' as const, primary: true },
    ]
    const passagen = {
      id: 'passage-a',
      source: 'kalla-a',
      reference: 'avsnitt 1',
      edition: 'George Long, 1877',
    }
    const utkastPassage = valideraInnehall(
      grund({
        rum: [rum({ status: 'publicerad', sources: medPassage })],
        passager: [{ ...passagen, status: 'utkast' }],
      }),
    )
    expect(
      utkastPassage.some((f) => f.includes('passage-a') && f.includes('opublicerad')),
    ).toBe(true)
    const publiceradPassage = valideraInnehall(
      grund({
        rum: [rum({ status: 'publicerad', sources: medPassage })],
        passager: [{ ...passagen, status: 'publicerad' }],
      }),
    )
    expect(publiceradPassage).toEqual([])
  })

  it('begränsar lästiden för publicerade rum till 1–10 minuter', () => {
    const fel = valideraInnehall(
      grund({ rum: [rum({ status: 'publicerad', readingTimeMinutes: 12 })] }),
    )
    expect(fel.some((f) => f.includes('lästid'))).toBe(true)
    expect(valideraInnehall(grund({ rum: [rum({ readingTimeMinutes: 12 })] }))).toEqual([])
  })

  it('kräver att temats standardrum finns och tillhör temat', () => {
    const okänt = valideraInnehall(grund({ themes: [tema({ defaultRoom: 'rum-x' })] }))
    expect(okänt.some((f) => f.includes('rum-x'))).toBe(true)
    const felTema = valideraInnehall(
      grund({
        themes: [tema(), tema({ id: 'tema-b', slug: 'tema-b', defaultRoom: 'rum-a' })],
      }),
    )
    expect(felTema.some((f) => f.includes('tema-b') && f.includes('tillhör'))).toBe(true)
  })

  it('kräver publicerat standardrum för publicerade themes', () => {
    const fel = valideraInnehall(grund({ themes: [tema({ defaultRoom: 'rum-a' })] }))
    expect(fel.some((f) => f.includes('opublicer'))).toBe(true)
  })

  it('fångar brutna relationer från frågor, vandringar och passager', () => {
    const fel = valideraInnehall(
      grund({
        frågor: [fråga({ themes: ['tema-x'], relatedQuestions: ['fraga-x'] })],
        vandringar: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            title: 'Vandring A',
            introduction: 'Intro.',
            centralQuestion: 'fraga-x',
            rum: ['rum-a', 'rum-x', 'rum-y'],
            status: 'utkast',
            created: '2026-07-09',
            updated: '2026-07-09',
          },
        ],
        passager: [
          { id: 'passage-a', source: 'kalla-x', reference: 'avsnitt 1', status: 'utkast' },
        ],
      }),
    )
    expect(fel.some((f) => f.includes('fraga-a') && f.includes('tema-x'))).toBe(true)
    expect(fel.some((f) => f.includes('fraga-a') && f.includes('fraga-x'))).toBe(true)
    expect(fel.some((f) => f.includes('vandring-a') && f.includes('rum-x'))).toBe(true)
    expect(fel.some((f) => f.includes('passage-a') && f.includes('kalla-x'))).toBe(true)
  })

  it('hindrar publicerade frågor från att länka opublicerade themes och frågor', () => {
    // Frågan är publicerad men temat den pekar på (tema-a) är utkast.
    const opubliceratTema = valideraInnehall(
      grund({
        rum: [rum({ themes: ['tema-b'] })],
        themes: [tema({ status: 'utkast' }), tema({ id: 'tema-b', slug: 'tema-b' })],
      }),
    )
    expect(
      opubliceratTema.some((f) => f.includes('fraga-a') && f.includes('opublicerad(t) tema')),
    ).toBe(true)
    const opubliceradRelaterad = valideraInnehall(
      grund({
        frågor: [
          fråga({ relatedQuestions: ['fraga-b'] }),
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
        rum: [rum({ themes: ['tema-a'], primaryQuestion: 'fraga-a' })],
        themes: [tema(), tema({ id: 'tema-b', slug: 'tema-b', status: 'utkast' })],
        frågor: [fråga({ status: 'utkast', themes: ['tema-b'] })],
      }),
    )
    expect(utkastfråga).toEqual([])
  })

  it('kräver att källors traditions finns och hindrar publicerad source från att länka opublicerad tradition', () => {
    const traditionen = { id: 'tradition-a', slug: 'tradition-a', name: 'Tradition A' }
    const okänd = valideraInnehall(
      grund({ sources: [source({ traditions: ['tradition-x'] })] }),
    )
    expect(okänd.some((f) => f.includes('kalla-a') && f.includes('tradition-x'))).toBe(true)
    const opublicerad = valideraInnehall(
      grund({
        sources: [source({ traditions: ['tradition-a'] })],
        traditions: [{ ...traditionen, status: 'utkast' }],
      }),
    )
    expect(
      opublicerad.some((f) => f.includes('kalla-a') && f.includes('opublicerad tradition')),
    ).toBe(true)
    const publicerad = valideraInnehall(
      grund({
        sources: [source({ traditions: ['tradition-a'] })],
        traditions: [{ ...traditionen, status: 'publicerad' }],
      }),
    )
    expect(publicerad).toEqual([])
    // Utkastkällor är fria — grinden gäller bara publicerat.
    const utkastkälla = valideraInnehall(
      grund({
        rum: [rum({ sources: [{ source: 'kalla-b', use: 'bearbetning', primary: true }] })],
        sources: [
          source({ id: 'kalla-b', slug: 'kalla-b' }),
          source({ status: 'utkast', traditions: ['tradition-a'] }),
        ],
        traditions: [{ ...traditionen, status: 'utkast' }],
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
            title: 'Vandring A',
            introduction: 'Intro.',
            centralQuestion: 'fraga-a',
            rum: ['rum-a', 'rum-b', 'rum-c'],
            status: 'publicerad',
            created: '2026-07-09',
            updated: '2026-07-09',
          },
        ],
      }),
    )
    expect(fel.some((f) => f.includes('vandring-a') && f.includes('opublicer'))).toBe(true)
  })

  it('kräver källpassage med edition för citat och translation i publicerade rum', () => {
    const utanPassage = [{ source: 'kalla-a', use: 'citat' as const, primary: true }]
    // Utkast får sakna passage — grinden gäller bara publicerat.
    expect(valideraInnehall(grund({ rum: [rum({ sources: utanPassage })] }))).toEqual([])
    const publiceratUtan = valideraInnehall(
      grund({ rum: [rum({ status: 'publicerad', sources: utanPassage })] }),
    )
    expect(publiceratUtan.some((f) => f.includes('citat') && f.includes('källpassage'))).toBe(true)
    // Passage utan edition räcker inte.
    const medPassage = [
      { source: 'kalla-a', passage: 'passage-a', use: 'citat' as const, primary: true },
    ]
    const utanUtgava = valideraInnehall(
      grund({
        rum: [rum({ status: 'publicerad', sources: medPassage })],
        passager: [passage()],
      }),
    )
    expect(utanUtgava.some((f) => f.includes('citat') && f.includes('edition'))).toBe(true)
    // Med reference + edition passerar citatet.
    const komplett = valideraInnehall(
      grund({
        rum: [rum({ status: 'publicerad', sources: medPassage })],
        passager: [passage({ edition: 'George Long, 1877' })],
      }),
    )
    expect(komplett).toEqual([])
  })

  it('kräver angiven translator för egen translation', () => {
    const relation = [
      { source: 'kalla-a', passage: 'passage-a', use: 'translation' as const, primary: true },
    ]
    const utanÖversättare = valideraInnehall(
      grund({
        rum: [rum({ status: 'publicerad', sources: relation })],
        passager: [passage({ edition: 'Grekiska (public domain)' })],
      }),
    )
    expect(
      utanÖversättare.some((f) => f.includes('translation') && f.includes('translator')),
    ).toBe(true)
    const medÖversättare = valideraInnehall(
      grund({
        rum: [rum({ status: 'publicerad', sources: relation })],
        passager: [passage({ edition: 'Grekiska (public domain)', translator: 'Redaktionen' })],
      }),
    )
    expect(medÖversättare).toEqual([])
  })

  it('kräver upphovs- och dateringsstatus för publicerade sources', () => {
    const utan = valideraInnehall(
      grund({ sources: [source({ attribution: undefined, dating: undefined })] }),
    )
    expect(utan.some((f) => f.includes('kalla-a') && f.includes('attribution'))).toBe(true)
    expect(utan.some((f) => f.includes('kalla-a') && f.includes('dating'))).toBe(true)
    // Utkastkällor slipper grinden.
    const utkast = valideraInnehall(
      grund({
        rum: [rum({ sources: [{ source: 'kalla-b', use: 'bearbetning', primary: true }] })],
        sources: [
          source({ id: 'kalla-b', slug: 'kalla-b' }),
          source({ status: 'utkast', attribution: undefined, dating: undefined }),
        ],
      }),
    )
    expect(utkast).toEqual([])
  })

  it('hindrar publicerade vandringar från att länka en opublicerad central fråga', () => {
    const fel = valideraInnehall(
      grund({
        // fraga-b är utkast och central; rummen är publicerade så bara den
        // centrala frågan bryter grinden.
        frågor: [fråga(), fråga({ id: 'fraga-b', slug: 'fraga-b', status: 'utkast' })],
        rum: [
          rum({ status: 'publicerad' }),
          rum({ id: 'rum-b', slug: 'rum-b', status: 'publicerad' }),
          rum({ id: 'rum-c', slug: 'rum-c', status: 'publicerad' }),
        ],
        vandringar: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            title: 'Vandring A',
            introduction: 'Intro.',
            centralQuestion: 'fraga-b',
            rum: ['rum-a', 'rum-b', 'rum-c'],
            status: 'publicerad',
            created: '2026-07-09',
            updated: '2026-07-09',
          },
        ],
      }),
    )
    expect(fel.some((f) => f.includes('vandring-a') && f.includes('central fråga'))).toBe(true)
  })
})
