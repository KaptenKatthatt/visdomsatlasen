import { sqlite } from '../db'

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

// Search books by name/abbreviation (e.g. "matteus" → Matteusevangeliet, "andra
// mos" → Andra Moseboken). The books are few, so we filter in JS with correct
// unicode lowercasing; every search term must appear in the name.
export const searchBooks = (query: string, limit = 12): BookHit[] => {
  const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 0)
  if (tokens.length === 0) return []
  const rows = sqlite
    .prepare(
      `SELECT b.work_id AS workId, w.title AS workTitle, b.id AS bookId,
              b.name AS bookName, b.abbrev AS abbrev
       FROM books b JOIN works w ON w.id = b.work_id
       ORDER BY b.work_id, b.position`,
    )
    .all() as (BookHit & { abbrev: string })[]
  return rows
    .filter((r) => {
      const hay = `${r.bookName} ${r.abbrev}`.toLowerCase()
      return tokens.every((t) => hay.includes(t))
    })
    .slice(0, limit)
    .map((r) => ({ workId: r.workId, workTitle: r.workTitle, bookId: r.bookId, bookName: r.bookName }))
}

// Build a safe FTS5 query: keep only letters/digits as tokens (everything else
// becomes a space), so no FTS5 operator character (. + { } " * ( ) : ^ -) can reach
// MATCH and break the syntax. Each token becomes a prefix match (`word*`).
const toFtsQuery = (raw: string): string =>
  raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => `${t}*`)
    .join(' ')

const SEARCH_SQL = `
  SELECT v.work_id AS workId, w.title AS workTitle, v.book_id AS bookId,
         b.name AS bookName, v.chapter AS chapter, v.verse AS verse,
         snippet(verses_fts, 0, '⟦', '⟧', '…', 12) AS snippet
  FROM verses_fts f
  JOIN verses v ON v.id = f.rowid
  JOIN books b ON b.id = v.book_id
  JOIN works w ON w.id = v.work_id
  WHERE verses_fts MATCH ?
  ORDER BY rank
  LIMIT ?
`

/** Full-text search over all verses via FTS5. An empty query returns no hits. */
export const searchVerses = (query: string, limit = 40): SearchHit[] => {
  const match = toFtsQuery(query)
  if (match.length === 0) return []
  try {
    return sqlite.prepare(SEARCH_SQL).all(match, limit) as SearchHit[]
  } catch {
    // Should an unexpected token slip through anyway, the error is neutralized to zero
    // hits instead of a 500 response.
    return []
  }
}
