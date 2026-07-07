import { mapPool } from '../../lib/concurrency'
import { translateMany } from '../translate'
import type { NormalizedVerse, NormalizedWork, WorkMeta } from '../model'

// En rå vers innan översättning: dess nummer, källtext (engelska/pali …) och
// valfri originaltext att bevara vid sidan av den svenska översättningen.
type RawVerse = { verse: number; source: string; orig?: string }
export type RawChapter = { chapter: number; verses: RawVerse[] }

type BuiltVerses = { verses: NormalizedVerse[]; translatedVerses: number; totalVerses: number }

// Översätt varje kapitels verser till svenska och bygg NormalizedVerse[], samt
// räkna hur många verser som faktiskt översattes (underlag för verifieringen).
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
// En namngiven bok med sina råkapitel (för verk med flera namngivna delar:
// Eddornas dikter, Epiktetos böcker, Senecas dialoger …).
export type NamedBook = { info: BookInfo; chapters: RawChapter[] }

/** Översätter råkapitel och sätter ihop ett ett-bok-verk (delas av adaptrarna). */
export const buildTranslatedWork = async (
  chapters: RawChapter[],
  book: BookInfo,
  metaFor: (translated: boolean) => WorkMeta,
  concurrency = 4,
): Promise<NormalizedWork> => {
  const { verses, translatedVerses, totalVerses } = await translateChapters(chapters, concurrency)
  // Räkna verket som översatt om minst hälften av verserna översattes; den
  // exakta täckningen rapporteras separat i stats för verifiering.
  const translated = totalVerses > 0 && translatedVerses * 2 >= totalVerses
  return { meta: metaFor(translated), books: [{ ...book, verses }], stats: { translatedVerses } }
}

/** Som buildTranslatedWork men för verk med flera namngivna böcker. Böckerna
 * översätts en i taget (kapitlen inom en bok parallellt) så Ollama inte överlastas. */
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
