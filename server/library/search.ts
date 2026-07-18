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

// Sök böcker på name/förkortning (t.ex. "matteus" → Matteusevangeliet, "andra
// mos" → Andra Moseboken). Böckerna är få, så vi filtrerar i JS med korrekt
// unicode-gemener; alla sökord måste finnas i namnet.
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

// Bygg en säker FTS5-fråga: behåll bara bokstäver/siffror som token (allt annat
// blir mellanslag), så inget FTS5-operatortecken (. + { } " * ( ) : ^ -) kan nå
// MATCH och bryta syntaxen. Varje token blir prefix-matchning (`ord*`).
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

/** Fritextsök över alla verser via FTS5. Tom fråga ger inga träffar. */
export const searchVerses = (query: string, limit = 40): SearchHit[] => {
  const match = toFtsQuery(query)
  if (match.length === 0) return []
  try {
    return sqlite.prepare(SEARCH_SQL).all(match, limit) as SearchHit[]
  } catch {
    // Skulle en oväntad token ändå slippa igenom neutraliseras felet till noll
    // träffar i stället för ett 500-svar.
    return []
  }
}
