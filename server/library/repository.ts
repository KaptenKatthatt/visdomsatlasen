import { and, asc, eq, gt, lt, desc } from 'drizzle-orm'
import { db, sqlite } from '../db'
import { books, verses, works } from '../db/schema'
import type { Book, Verse, Work } from '../db/schema'

export type WorkSummary = Work & { bookCount: number }
// Boken med sina faktiska kapitelnummer, så vyerna inte antar 1..N i följd.
export type BookWithChapters = Book & { chapters: number[] }

/** Verk-id som redan är lagrade i databasen (används av auto-ingesten). */
export const presentWorkIds = (): Set<string> =>
  new Set(db.select({ id: works.id }).from(works).all().map((w) => w.id))

export const listWorks = (): WorkSummary[] => {
  const rows = db.select().from(works).orderBy(asc(works.position), asc(works.title)).all()
  // Räkna böcker per verk i en enda fråga i stället för en per verk.
  const counts = new Map<string, number>()
  for (const b of db.select({ workId: books.workId }).from(books).all()) {
    counts.set(b.workId, (counts.get(b.workId) ?? 0) + 1)
  }
  return rows.map((w) => ({ ...w, bookCount: counts.get(w.id) ?? 0 }))
}

// Faktiska kapitelnummer per bok (kan ha luckor eller inte börja på 1).
const chapterNumbers = (workId: string): Map<string, number[]> => {
  const rows = sqlite
    .prepare(
      `SELECT book_id AS bookId, chapter FROM verses WHERE work_id = ?
       GROUP BY book_id, chapter ORDER BY chapter`,
    )
    .all(workId) as { bookId: string; chapter: number }[]
  const map = new Map<string, number[]>()
  for (const row of rows) {
    const list = map.get(row.bookId) ?? []
    list.push(row.chapter)
    map.set(row.bookId, list)
  }
  return map
}

export const getWork = (id: string): { work: Work; books: BookWithChapters[] } | null => {
  const work = db.select().from(works).where(eq(works.id, id)).get()
  if (!work) return null
  const list = db.select().from(books).where(eq(books.workId, id)).orderBy(asc(books.position)).all()
  const chapters = chapterNumbers(id)
  return { work, books: list.map((b) => ({ ...b, chapters: chapters.get(b.id) ?? [] })) }
}

const neighbourChapter = (bookId: string, chapter: number, dir: 'prev' | 'next'): number | null => {
  const cond = dir === 'next' ? gt(verses.chapter, chapter) : lt(verses.chapter, chapter)
  const order = dir === 'next' ? asc(verses.chapter) : desc(verses.chapter)
  const row = db
    .select({ chapter: verses.chapter })
    .from(verses)
    .where(and(eq(verses.bookId, bookId), cond))
    .orderBy(order)
    .get()
  return row?.chapter ?? null
}

export type ChapterView = {
  book: Book
  chapter: number
  verses: Verse[]
  prev: number | null
  next: number | null
}

export const getChapter = (bookId: string, chapter: number): ChapterView | null => {
  const book = db.select().from(books).where(eq(books.id, bookId)).get()
  if (!book) return null
  const rows = db
    .select()
    .from(verses)
    .where(and(eq(verses.bookId, bookId), eq(verses.chapter, chapter)))
    .orderBy(asc(verses.verse))
    .all()
  if (rows.length === 0) return null
  return {
    book,
    chapter,
    verses: rows,
    prev: neighbourChapter(bookId, chapter, 'prev'),
    next: neighbourChapter(bookId, chapter, 'next'),
  }
}
