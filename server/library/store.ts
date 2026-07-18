import { sqlite, db } from '../db'
import { books, works } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { NormalizedBook, NormalizedWork } from '../ingest/model'

const insertBookVerses = (workId: string, bookId: string, book: NormalizedBook): number => {
  const stmt = sqlite.prepare(
    `INSERT INTO verses (work_id, book_id, chapter, verse, text, orig_text)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
  for (const v of book.verses) {
    stmt.run(workId, bookId, v.chapter, v.verse, v.text, v.origText ?? null)
  }
  const chapters = new Set(book.verses.map((v) => v.chapter))
  return chapters.size
}

const replaceWork = (work: NormalizedWork): number => {
  const { meta } = work
  // Replace the work in its entirety — an idempotent re-run yields the same result.
  sqlite.prepare(`DELETE FROM verses WHERE work_id = ?`).run(meta.id)
  db.delete(books).where(eq(books.workId, meta.id)).run()
  db.delete(works).where(eq(works.id, meta.id)).run()

  let verseTotal = 0
  work.books.forEach((book, index) => {
    const bookId = `${meta.id}/${book.slug}`
    const chapterCount = insertBookVerses(meta.id, bookId, book)
    verseTotal += book.verses.length
    db.insert(books)
      .values({ id: bookId, workId: meta.id, name: book.name, abbrev: book.abbrev, position: index, chapterCount })
      .run()
  })

  db.insert(works)
    .values({
      id: meta.id,
      title: meta.title,
      subtitle: meta.subtitle ?? null,
      tradition: meta.tradition,
      author: meta.author,
      lang: meta.lang,
      translation: meta.translation,
      license: meta.license,
      sourceUrl: meta.sourceUrl,
      translated: meta.translated ? 1 : 0,
      position: 0,
      verseCount: verseTotal,
    })
    .run()
  return verseTotal
}

/** Writes a normalized work to the database in a transaction. */
export const storeWork = (work: NormalizedWork): number => {
  const tx = sqlite.transaction(() => replaceWork(work))
  return tx()
}
