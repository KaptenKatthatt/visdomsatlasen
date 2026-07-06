// Normaliserad mellanmodell som alla källadaptrar producerar. Håller ingest-
// koden oberoende av varje källas egna format (getbible, Gutenberg, SuttaCentral …).

export type NormalizedVerse = {
  chapter: number
  verse: number
  text: string
  // Valfri originaltext (pali, grekiska …) bevarad vid sidan av översättningen.
  origText?: string
}

export type NormalizedBook = {
  // Stabilt bok-id, unikt inom verket (t.ex. "joh", "kap").
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
  // Verifieringsunderlag: hur många verser som faktiskt översattes (för
  // översatta verk). Saknas för verk som redan är på svenska (Bibeln).
  stats?: { translatedVerses: number }
}
