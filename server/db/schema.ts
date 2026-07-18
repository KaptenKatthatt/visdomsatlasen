import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core'

// A work = an entire source text (e.g. the Bible 1917, Meditations, Dhammapada).
export const works = sqliteTable('works', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  tradition: text('tradition').notNull(),
  author: text('author').notNull(),
  // Source language to display (e.g. "Grekiska", "Pali").
  lang: text('lang').notNull(),
  // Which translation the text comes from.
  translation: text('translation').notNull(),
  license: text('license').notNull(),
  sourceUrl: text('source_url').notNull(),
  // 1 if the text was machine-translated (via Ollama) and should therefore be read with discernment.
  translated: integer('translated').notNull().default(0),
  position: integer('position').notNull().default(0),
  verseCount: integer('verse_count').notNull().default(0),
})

// A book/section within a work (the Bible's 66 books; a short work has one book).
export const books = sqliteTable(
  'books',
  {
    id: text('id').primaryKey(),
    workId: text('work_id').notNull(),
    name: text('name').notNull(),
    abbrev: text('abbrev').notNull(),
    position: integer('position').notNull(),
    chapterCount: integer('chapter_count').notNull().default(0),
  },
  (table) => [index('books_work_idx').on(table.workId, table.position)],
)

// A single verse/line. `text` is the reading version (Swedish); `origText` is the optional
// original text (e.g. Pali/Greek) for works we translated.
export const verses = sqliteTable(
  'verses',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workId: text('work_id').notNull(),
    bookId: text('book_id').notNull(),
    chapter: integer('chapter').notNull(),
    verse: integer('verse').notNull(),
    text: text('text').notNull(),
    origText: text('orig_text'),
  },
  (table) => [index('verses_chapter_idx').on(table.bookId, table.chapter, table.verse)],
)

export type Work = typeof works.$inferSelect
export type Book = typeof books.$inferSelect
export type Verse = typeof verses.$inferSelect
