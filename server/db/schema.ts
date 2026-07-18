import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core'

// Ett verk = en hel källtext (t.ex. Bibeln 1917, Självbetraktelser, Dhammapada).
export const works = sqliteTable('works', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  tradition: text('tradition').notNull(),
  author: text('author').notNull(),
  // Källspråk att visa (t.ex. "Grekiska", "Pali").
  lang: text('lang').notNull(),
  // Vilken translation texten kommer från.
  translation: text('translation').notNull(),
  license: text('license').notNull(),
  sourceUrl: text('source_url').notNull(),
  // 1 om texten maskinöversatts (via Ollama) och alltså bör läsas med urskillning.
  translated: integer('translated').notNull().default(0),
  position: integer('position').notNull().default(0),
  verseCount: integer('verse_count').notNull().default(0),
})

// En bok/avdelning inom ett verk (Bibelns 66 böcker; ett kort verk har en bok).
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

// En enskild vers/rad. `text` är läsversionen (svensk); `origText` är valfri
// originalText (t.ex. pali/grekiska) för verk vi översatt.
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
