// Typad klient mot bibliotekets API (server/api/library.ts). Samma origin, så
// webbläsarens cachade basic auth följer med automatiskt.

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

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (response.status === 401) {
    // Sessionen har gått ut — skicka till inloggningsformuläret (som Proton
    // Pass kan autofylla) och behåll nuvarande sida som återvändo-mål.
    const from = window.location.pathname + window.location.search
    window.location.assign(`/login?from=${encodeURIComponent(from)}`)
    throw new Error('Sessionen har gått ut')
  }
  if (!response.ok) throw new Error(`Kunde inte hämta (${response.status})`)
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
