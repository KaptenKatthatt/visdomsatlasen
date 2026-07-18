// Typad klient mot bibliotekets API (server/api/library.ts). Samma origin;
// läsning är öppen (servern körs Tailscale-only, se server/index.ts).
import { rapportera, utanFraga } from './telemetri'

export type Work = {
  id: string
  title: string
  subtitle: string | null
  tradition: string
  author: string
  lang: string
  translation: string
  license: string
  sourceUrl: string
  translated: number
  position: number
  verseCount: number
}

export type WorkSummary = Work & { bookCount: number }

export type Book = {
  id: string
  workId: string
  name: string
  abbrev: string
  position: number
  chapterCount: number
}

// Boken med sina faktiska kapitelnummer (kan ha luckor / inte börja på 1).
export type BookWithChapters = Book & { chapters: number[] }

export type Verse = {
  id: number
  workId: string
  bookId: string
  chapter: number
  verse: number
  text: string
  origText: string | null
}

export type ChapterView = {
  book: Book
  chapter: number
  verses: Verse[]
  prev: number | null
  next: number | null
}

export type SearchHit = {
  workId: string
  workTitle: string
  bookId: string
  bookName: string
  chapter: number
  verse: number
  snippet: string
}

export type BookHit = {
  workId: string
  workTitle: string
  bookId: string
  bookName: string
}

/** Lugna, svenska felmeddelanden i stället för råa `TypeError: Failed to fetch`
 * eller statuskoder. Källtexterna kommer från biblioteks-API:t (server/), så en
 * bruten uppkoppling ska mötas begripligt (fas 13, provide calm offline errors) —
 * inte som ett tekniskt haveri. Det redaktionella innehållet ligger i bunten och
 * berörs aldrig av detta; bara verkläsarens texter hämtas över nätet. */
const OFFLINE_TEXT = 'Du verkar vara offline. Texten går att läsa igen när du är ansluten.'
const NAT_TEXT = 'Texten går inte att hämta just nu. Kontrollera din uppkoppling och försök igen.'
const SVAR_TEXT = 'Kunde inte hämta texten just nu. Försök igen om en stund.'

const ärOffline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine === false

const getJson = async <T>(url: string): Promise<T> => {
  // Resursen loggas utan frågesträng, så en sökfrågas text aldrig läcker in i
  // telemetrin via /api/library/search?q=… (fas 14, sensitive query data).
  const resurs = utanFraga(url)
  let response: Response
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } })
  } catch {
    // fetch avvisar med TypeError vid nätverksfel (offline, avbruten uppkoppling).
    const offline = ärOffline()
    rapportera({ typ: offline ? 'offline-laddningsfel' : 'sidladdningsfel', resurs })
    throw new Error(offline ? OFFLINE_TEXT : NAT_TEXT)
  }
  if (!response.ok) {
    rapportera({ typ: 'sidladdningsfel', resurs, detalj: `status ${response.status}` })
    throw new Error(SVAR_TEXT)
  }
  return (await response.json()) as T
}

/** Bok-id i API:t är `${workId}/${slug}`; koda båda leden för URL:en. */
export const bookId = (workId: string, slug: string): string => `${workId}/${slug}`

/** Plockar ut bok-sluggen ur ett fullständigt bok-id. */
export const slugOfBook = (workId: string, id: string): string =>
  id.startsWith(`${workId}/`) ? id.slice(workId.length + 1) : id

export const fetchWorks = (): Promise<{ works: WorkSummary[] }> =>
  getJson('/api/library/works')

export const fetchWork = (id: string): Promise<{ work: Work; books: BookWithChapters[] }> =>
  getJson(`/api/library/works/${encodeURIComponent(id)}`)

export const fetchChapter = (id: string, chapter: number): Promise<ChapterView> =>
  getJson(`/api/library/books/${encodeURIComponent(id)}/chapters/${chapter}`)

export const searchLibrary = (
  query: string,
): Promise<{ books: BookHit[]; hits: SearchHit[] }> =>
  getJson(`/api/library/search?q=${encodeURIComponent(query)}`)
