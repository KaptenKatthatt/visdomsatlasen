// Typed client for the library API (server/api/library.ts). Same origin;
// reading is open (the server runs Tailscale-only, see server/index.ts).
import { report, withoutQuestion } from './telemetry'

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

// The book with its actual chapter numbers (may have gaps / not start at 1).
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

/** Calm, Swedish error messages instead of raw `TypeError: Failed to fetch`
 * or status codes. The source texts come from the library API (server/), so a
 * broken connection should be met intelligibly (phase 13, provide calm offline
 * errors) — not as a technical breakdown. The editorial content lives in the
 * bundle and is never affected by this; only the reader's texts are fetched over the network. */
const OFFLINE_TEXT = 'Du verkar vara offline. Texten går att läsa igen när du är ansluten.'
const NAT_TEXT = 'Texten går inte att hämta just nu. Kontrollera din uppkoppling och försök igen.'
const SVAR_TEXT = 'Kunde inte hämta texten just nu. Försök igen om en stund.'

const isOffline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine === false

const getJson = async <T>(url: string): Promise<T> => {
  // The resource is logged without its query string, so a search query's text
  // never leaks into telemetry via /api/library/search?q=… (phase 14, sensitive query data).
  const resurs = withoutQuestion(url)
  let response: Response
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } })
  } catch {
    // fetch rejects with TypeError on network errors (offline, dropped connection).
    const offline = isOffline()
    report({ type: offline ? 'offline-laddningsfel' : 'sidladdningsfel', resurs })
    throw new Error(offline ? OFFLINE_TEXT : NAT_TEXT)
  }
  if (!response.ok) {
    report({ type: 'sidladdningsfel', resurs, detalj: `status ${response.status}` })
    throw new Error(SVAR_TEXT)
  }
  return (await response.json()) as T
}

/** A book id in the API is `${workId}/${slug}`; encode both parts for the URL. */
export const bookId = (workId: string, slug: string): string => `${workId}/${slug}`

/** Extracts the book slug from a full book id. */
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
