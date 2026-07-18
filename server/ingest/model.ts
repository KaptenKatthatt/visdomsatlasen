// Normalized intermediate model that all source adapters produce. Keeps the ingest
// code independent of each source's own format (getbible, Gutenberg, SuttaCentral …).

export type NormalizedVerse = {
  chapter: number
  verse: number
  text: string
  // Optional original text (Pali, Greek …) kept alongside the translation.
  origText?: string
}

export type NormalizedBook = {
  // Stable book id, unique within the work (e.g. "joh", "kap").
  slug: string
  name: string
  abbrev: string
  verses: NormalizedVerse[]
}

export type WorkMeta = {
  id: string
  title: string
  subtitle?: string
  tradition: string
  author: string
  lang: string
  translation: string
  license: string
  sourceUrl: string
  translated: boolean
}

export type NormalizedWork = {
  meta: WorkMeta
  books: NormalizedBook[]
  // Verification data: how many verses were actually translated (for
  // translated works). Absent for works that are already in Swedish (the Bible).
  stats?: { translatedVerses: number }
}
