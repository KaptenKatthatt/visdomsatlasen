import { describe, expect, it } from 'vitest'
import type { Question, ContentSet, Source, SourcePassage, Room, Theme } from './schema'
import { validateContent } from './validate'

const room = (över: Partial<Room> = {}): Room => ({
  id: 'rum-a',
  slug: 'rum-a',
  title: 'Rum A',
  summary: 'Sammanfattning.',
  primaryQuestion: 'fraga-a',
  themes: ['tema-a'],
  thoughtToCarry: 'En tanke.',
  reflectionQuestions: ['En fråga?'],
  sources: [{ source: 'kalla-a', use: 'adaptation', primary: true }],
  readingTimeMinutes: 4,
  language: 'sv',
  status: 'draft',
  created: '2026-07-09',
  updated: '2026-07-09',
  opening: 'Öppning.',
  core: 'Kärna.',
  ...över,
})

const theme = (över: Partial<Theme> = {}): Theme => ({
  id: 'tema-a',
  slug: 'tema-a',
  label: 'Tema A',
  status: 'published',
  ...över,
})

const question = (över: Partial<Question> = {}): Question => ({
  id: 'fraga-a',
  slug: 'fraga-a',
  text: 'Vad är A?',
  themes: ['tema-a'],
  status: 'published',
  ...över,
})

const source = (över: Partial<Source> = {}): Source => ({
  id: 'kalla-a',
  slug: 'kalla-a',
  title: 'Källa A',
  type: 'book',
  attribution: 'known',
  dating: 'known',
  rights: 'public-domain',
  status: 'published',
  ...över,
})

const passage = (över: Partial<SourcePassage> = {}): SourcePassage => ({
  id: 'passage-a',
  source: 'kalla-a',
  reference: 'avsnitt 1',
  status: 'published',
  ...över,
})

const grund = (över: Partial<ContentSet> = {}): ContentSet => ({
  rooms: [room()],
  themes: [theme()],
  questions: [question()],
  paths: [],
  sources: [source()],
  passages: [],
  traditions: [],
  people: [],
  ...över,
})

describe('valideraInnehall', () => {
  it('godkänner en konsistent innehållsmängd', () => {
    expect(validateContent(grund())).toEqual([])
  })

  it('fångar dubblerade id och sluggar inom en samling', () => {
    const fel = validateContent(grund({ themes: [theme(), theme({ label: 'Kopia' })] }))
    expect(fel.some((f) => f.includes('tema-a') && f.includes('dubblett'))).toBe(true)
  })

  it('fångar rum vars primära fråga inte finns', () => {
    const fel = validateContent(grund({ rooms: [room({ primaryQuestion: 'saknas' })] }))
    expect(fel.some((f) => f.includes('rum-a') && f.includes('saknas'))).toBe(true)
  })

  it('fångar rum med okänt tema och okänd källa', () => {
    const fel = validateContent(
      grund({
        rooms: [
          room({
            themes: ['tema-x'],
            sources: [{ source: 'kalla-x', use: 'adaptation', primary: true }],
          }),
        ],
      }),
    )
    expect(fel.some((f) => f.includes('tema-x'))).toBe(true)
    expect(fel.some((f) => f.includes('kalla-x'))).toBe(true)
  })

  it('kräver primär källa för publicerade rum men inte för utkast', () => {
    const withoutPrimary = [{ source: 'kalla-a', use: 'adaptation' as const, primary: false }]
    const draft = validateContent(grund({ rooms: [room({ sources: withoutPrimary })] }))
    expect(draft).toEqual([])
    const published = validateContent(
      grund({ rooms: [room({ status: 'published', sources: withoutPrimary })] }),
    )
    expect(published.some((f) => f.includes('primary source'))).toBe(true)
  })

  it('hindrar publicerade rum från att länka opublicerat innehåll', () => {
    const fel = validateContent(
      grund({
        rooms: [room({ status: 'published' })],
        questions: [question({ status: 'draft' })],
        sources: [source({ status: 'review' })],
      }),
    )
    expect(fel.some((f) => f.includes('fraga-a') && f.includes('opublicerad'))).toBe(true)
    expect(fel.some((f) => f.includes('kalla-a') && f.includes('opublicerad'))).toBe(true)
  })

  it('hindrar publicerade rum från att länka opublicerade källpassager', () => {
    const medPassage = [
      { source: 'kalla-a', passage: 'passage-a', use: 'quote' as const, primary: true },
    ]
    const passagen = {
      id: 'passage-a',
      source: 'kalla-a',
      reference: 'avsnitt 1',
      edition: 'George Long, 1877',
    }
    const draftPassage = validateContent(
      grund({
        rooms: [room({ status: 'published', sources: medPassage })],
        passages: [{ ...passagen, status: 'draft' }],
      }),
    )
    expect(
      draftPassage.some((f) => f.includes('passage-a') && f.includes('opublicerad')),
    ).toBe(true)
    const publishedPassage = validateContent(
      grund({
        rooms: [room({ status: 'published', sources: medPassage })],
        passages: [{ ...passagen, status: 'published' }],
      }),
    )
    expect(publishedPassage).toEqual([])
  })

  it('begränsar lästiden för publicerade rum till 1–10 minuter', () => {
    const fel = validateContent(
      grund({ rooms: [room({ status: 'published', readingTimeMinutes: 12 })] }),
    )
    expect(fel.some((f) => f.includes('lästid'))).toBe(true)
    expect(validateContent(grund({ rooms: [room({ readingTimeMinutes: 12 })] }))).toEqual([])
  })

  it('kräver att temats standardrum finns och tillhör temat', () => {
    const unknown = validateContent(grund({ themes: [theme({ defaultRoom: 'rum-x' })] }))
    expect(unknown.some((f) => f.includes('rum-x'))).toBe(true)
    const errorTheme = validateContent(
      grund({
        themes: [theme(), theme({ id: 'tema-b', slug: 'tema-b', defaultRoom: 'rum-a' })],
      }),
    )
    expect(errorTheme.some((f) => f.includes('tema-b') && f.includes('tillhör'))).toBe(true)
  })

  it('kräver publicerat standardrum för publicerade teman', () => {
    const fel = validateContent(grund({ themes: [theme({ defaultRoom: 'rum-a' })] }))
    expect(fel.some((f) => f.includes('opublicer'))).toBe(true)
  })

  it('fångar brutna relationer från frågor, vandringar och passager', () => {
    const fel = validateContent(
      grund({
        questions: [question({ themes: ['tema-x'], relatedQuestions: ['fraga-x'] })],
        paths: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            title: 'Vandring A',
            introduction: 'Intro.',
            centralQuestion: 'fraga-x',
            rooms: ['rum-a', 'rum-x', 'rum-y'],
            status: 'draft',
            created: '2026-07-09',
            updated: '2026-07-09',
          },
        ],
        passages: [
          { id: 'passage-a', source: 'kalla-x', reference: 'avsnitt 1', status: 'draft' },
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
    const unpublishedTheme = validateContent(
      grund({
        rooms: [room({ themes: ['tema-b'] })],
        themes: [theme({ status: 'draft' }), theme({ id: 'tema-b', slug: 'tema-b' })],
      }),
    )
    expect(
      unpublishedTheme.some((f) => f.includes('fraga-a') && f.includes('opublicerad(t) tema')),
    ).toBe(true)
    const unpublishedRelaterad = validateContent(
      grund({
        questions: [
          question({ relatedQuestions: ['fraga-b'] }),
          question({ id: 'fraga-b', slug: 'fraga-b', status: 'draft' }),
        ],
      }),
    )
    expect(
      unpublishedRelaterad.some(
        (f) => f.includes('fraga-a') && f.includes('opublicerad(t) relaterad fråga'),
      ),
    ).toBe(true)
    // Utkastfrågor är fria att peka på opublicerat.
    const draftQuestion = validateContent(
      grund({
        rooms: [room({ themes: ['tema-a'], primaryQuestion: 'fraga-a' })],
        themes: [theme(), theme({ id: 'tema-b', slug: 'tema-b', status: 'draft' })],
        questions: [question({ status: 'draft', themes: ['tema-b'] })],
      }),
    )
    expect(draftQuestion).toEqual([])
  })

  it('kräver att källors traditioner finns och hindrar publicerad källa från att länka opublicerad tradition', () => {
    const traditionen = { id: 'tradition-a', slug: 'tradition-a', name: 'Tradition A' }
    const unknown = validateContent(
      grund({ sources: [source({ traditions: ['tradition-x'] })] }),
    )
    expect(unknown.some((f) => f.includes('kalla-a') && f.includes('tradition-x'))).toBe(true)
    const unpublished = validateContent(
      grund({
        sources: [source({ traditions: ['tradition-a'] })],
        traditions: [{ ...traditionen, status: 'draft' }],
      }),
    )
    expect(
      unpublished.some((f) => f.includes('kalla-a') && f.includes('opublicerad tradition')),
    ).toBe(true)
    const publicerad = validateContent(
      grund({
        sources: [source({ traditions: ['tradition-a'] })],
        traditions: [{ ...traditionen, status: 'published' }],
      }),
    )
    expect(publicerad).toEqual([])
    // Utkastkällor är fria — grinden gäller bara publicerat.
    const draftSource = validateContent(
      grund({
        rooms: [room({ sources: [{ source: 'kalla-b', use: 'adaptation', primary: true }] })],
        sources: [
          source({ id: 'kalla-b', slug: 'kalla-b' }),
          source({ status: 'draft', traditions: ['tradition-a'] }),
        ],
        traditions: [{ ...traditionen, status: 'draft' }],
      }),
    )
    expect(draftSource).toEqual([])
  })

  it('hindrar publicerade vandringar från att innehålla opublicerade rum', () => {
    const fel = validateContent(
      grund({
        rooms: [room(), room({ id: 'rum-b', slug: 'rum-b' }), room({ id: 'rum-c', slug: 'rum-c' })],
        paths: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            title: 'Vandring A',
            introduction: 'Intro.',
            centralQuestion: 'fraga-a',
            rooms: ['rum-a', 'rum-b', 'rum-c'],
            status: 'published',
            created: '2026-07-09',
            updated: '2026-07-09',
          },
        ],
      }),
    )
    expect(fel.some((f) => f.includes('vandring-a') && f.includes('opublicer'))).toBe(true)
  })

  it('kräver källpassage med utgåva för citat och översättning i publicerade rum', () => {
    const withoutPassage = [{ source: 'kalla-a', use: 'quote' as const, primary: true }]
    // Utkast får sakna passage — grinden gäller bara publicerat.
    expect(validateContent(grund({ rooms: [room({ sources: withoutPassage })] }))).toEqual([])
    const publishedWithout = validateContent(
      grund({ rooms: [room({ status: 'published', sources: withoutPassage })] }),
    )
    expect(publishedWithout.some((f) => f.includes('quote') && f.includes('källpassage'))).toBe(true)
    // Passage utan edition räcker inte.
    const medPassage = [
      { source: 'kalla-a', passage: 'passage-a', use: 'quote' as const, primary: true },
    ]
    const withoutUtgava = validateContent(
      grund({
        rooms: [room({ status: 'published', sources: medPassage })],
        passages: [passage()],
      }),
    )
    expect(withoutUtgava.some((f) => f.includes('quote') && f.includes('edition'))).toBe(true)
    // Med reference + edition passerar citatet.
    const komplett = validateContent(
      grund({
        rooms: [room({ status: 'published', sources: medPassage })],
        passages: [passage({ edition: 'George Long, 1877' })],
      }),
    )
    expect(komplett).toEqual([])
  })

  it('kräver angiven översättare för egen översättning', () => {
    const relation = [
      { source: 'kalla-a', passage: 'passage-a', use: 'translation' as const, primary: true },
    ]
    const withoutTranslator = validateContent(
      grund({
        rooms: [room({ status: 'published', sources: relation })],
        passages: [passage({ edition: 'Grekiska (public domain)' })],
      }),
    )
    expect(
      withoutTranslator.some((f) => f.includes('translation') && f.includes('translator')),
    ).toBe(true)
    const withTranslator = validateContent(
      grund({
        rooms: [room({ status: 'published', sources: relation })],
        passages: [passage({ edition: 'Grekiska (public domain)', translator: 'Redaktionen' })],
      }),
    )
    expect(withTranslator).toEqual([])
  })

  it('kräver upphovs- och dateringsstatus för publicerade källor', () => {
    const without = validateContent(
      grund({ sources: [source({ attribution: undefined, dating: undefined })] }),
    )
    expect(without.some((f) => f.includes('kalla-a') && f.includes('attribution'))).toBe(true)
    expect(without.some((f) => f.includes('kalla-a') && f.includes('dating'))).toBe(true)
    // Utkastkällor slipper grinden.
    const draft = validateContent(
      grund({
        rooms: [room({ sources: [{ source: 'kalla-b', use: 'adaptation', primary: true }] })],
        sources: [
          source({ id: 'kalla-b', slug: 'kalla-b' }),
          source({ status: 'draft', attribution: undefined, dating: undefined }),
        ],
      }),
    )
    expect(draft).toEqual([])
  })

  it('hindrar publicerade vandringar från att länka en opublicerad central fråga', () => {
    const fel = validateContent(
      grund({
        // fraga-b är utkast och central; rummen är publicerade så bara den
        // centrala frågan bryter grinden.
        questions: [question(), question({ id: 'fraga-b', slug: 'fraga-b', status: 'draft' })],
        rooms: [
          room({ status: 'published' }),
          room({ id: 'rum-b', slug: 'rum-b', status: 'published' }),
          room({ id: 'rum-c', slug: 'rum-c', status: 'published' }),
        ],
        paths: [
          {
            id: 'vandring-a',
            slug: 'vandring-a',
            title: 'Vandring A',
            introduction: 'Intro.',
            centralQuestion: 'fraga-b',
            rooms: ['rum-a', 'rum-b', 'rum-c'],
            status: 'published',
            created: '2026-07-09',
            updated: '2026-07-09',
          },
        ],
      }),
    )
    expect(fel.some((f) => f.includes('vandring-a') && f.includes('central fråga'))).toBe(true)
  })
})
