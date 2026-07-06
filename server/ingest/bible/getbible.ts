import { fetchJson } from '../../lib/fetchJson'
import { mapPool } from '../../lib/concurrency'
import { BIBLE_BOOKS, type BibleBook } from './books'
import { BIBLE_META } from './meta'
import type { NormalizedBook, NormalizedVerse, NormalizedWork } from '../model'

// getbible v2, public domain 1917 års bibel. Nås från VPS:en; sandbox-proxyn
// blockerar värden, därför verifieras pipelinen lokalt med fixture-adaptern.
const BASE = process.env['GETBIBLE_BASE'] ?? 'https://api.getbible.net/v2'
const TRANSLATION = 'swedish'
const FETCH_CONCURRENCY = 6

type Rec = Record<string, unknown>
const asRecords = (v: unknown): Rec[] => (Array.isArray(v) ? (v as Rec[]) : [])
const toNum = (v: unknown): number | null =>
  typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : null

// getbible kapslar kapitlen under antingen "book" eller "chapters" beroende på
// endpoint — plocka det som finns. Verstexten ligger stabilt i chapter/verse/text.
const chaptersOf = (data: Rec): Rec[] => asRecords(data['book'] ?? data['chapters'])

const versesOfChapter = (chapter: Rec): NormalizedVerse[] => {
  const chapterNr = toNum(chapter['chapter'])
  const out: NormalizedVerse[] = []
  for (const raw of asRecords(chapter['verses'])) {
    const verse = toNum(raw['verse'])
    const text = typeof raw['text'] === 'string' ? raw['text'].trim() : ''
    const ch = toNum(raw['chapter']) ?? chapterNr
    if (ch !== null && verse !== null && text.length > 0) out.push({ chapter: ch, verse, text })
  }
  return out
}

const fetchBook = async (book: BibleBook): Promise<NormalizedBook> => {
  const data = (await fetchJson(`${BASE}/${TRANSLATION}/${book.nr}.json`)) as Rec
  const verses = chaptersOf(data).flatMap(versesOfChapter)
  if (verses.length === 0) throw new Error(`Inga verser för bok ${book.nr} (${book.name})`)
  return { slug: book.slug, name: book.name, abbrev: book.abbrev, verses }
}

/** Hämtar hela 1917 års bibel från getbible och normaliserar den. */
export const getbibleBible = async (): Promise<NormalizedWork> => {
  const books = await mapPool(BIBLE_BOOKS, FETCH_CONCURRENCY, fetchBook)
  return { meta: BIBLE_META, books }
}
