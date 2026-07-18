import { mapPool } from '../../lib/concurrency'
import { translateMany } from '../translate'
import type { NormalizedVerse, NormalizedWork, WorkMeta } from '../model'

// A raw verse before translation: its number, source text (English/Pali …) and
// an optional original text to keep alongside the Swedish translation.
type RawVerse = { verse: number; source: string; orig?: string }
export type RawChapter = { chapter: number; verses: RawVerse[] }

type BuiltVerses = { verses: NormalizedVerse[]; translatedVerses: number; totalVerses: number }

// Translate each chapter's verses into Swedish and build NormalizedVerse[], while
// counting how many verses were actually translated (input for verification).
const translateChapters = async (
  chapters: RawChapter[],
  concurrency = 4,
): Promise<BuiltVerses> => {
  const built = await mapPool(chapters, concurrency, async (ch) => {
    const { lines, translatedCount } = await translateMany(ch.verses.map((v) => v.source))
    const verses = ch.verses.map((v, i) => ({
      chapter: ch.chapter,
      verse: v.verse,
      text: lines[i] ?? v.source,
      origText: v.orig,
    }))
    return { verses, translatedCount }
  })
  const verses = built.flatMap((b) => b.verses)
  return {
    verses,
    translatedVerses: built.reduce((n, b) => n + b.translatedCount, 0),
    totalVerses: verses.length,
  }
}

type BookInfo = { slug: string; name: string; abbrev: string }
// A named book with its raw chapters (for works with several named parts:
// the poems of the Eddas, Epictetus' books, Seneca's dialogues …).
export type NamedBook = { info: BookInfo; chapters: RawChapter[] }

/** Translates raw chapters and assembles a single-book work (shared by the adapters). */
export const buildTranslatedWork = async (
  chapters: RawChapter[],
  book: BookInfo,
  metaFor: (translated: boolean) => WorkMeta,
  concurrency = 4,
): Promise<NormalizedWork> => {
  const { verses, translatedVerses, totalVerses } = await translateChapters(chapters, concurrency)
  // Count the work as translated if at least half of the verses were translated; the
  // exact coverage is reported separately in stats for verification.
  const translated = totalVerses > 0 && translatedVerses * 2 >= totalVerses
  return { meta: metaFor(translated), books: [{ ...book, verses }], stats: { translatedVerses } }
}

/** Like buildTranslatedWork but for works with several named books. The books
 * are translated one at a time (chapters within a book in parallel) so Ollama is not overloaded. */
export const buildTranslatedMultiBook = async (
  books: NamedBook[],
  metaFor: (translated: boolean) => WorkMeta,
  concurrency = 4,
): Promise<NormalizedWork> => {
  const out: NormalizedWork['books'] = []
  let translatedVerses = 0
  let totalVerses = 0
  for (const book of books) {
    const built = await translateChapters(book.chapters, concurrency)
    out.push({ ...book.info, verses: built.verses })
    translatedVerses += built.translatedVerses
    totalVerses += built.totalVerses
  }
  const translated = totalVerses > 0 && translatedVerses * 2 >= totalVerses
  return { meta: metaFor(translated), books: out, stats: { translatedVerses } }
}
