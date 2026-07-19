// Personal data (notes-and-saved.md): saved places and notes.
// Pure logic without React or localStorage — migration, sorting and labels
// live here so store.tsx just wires things together and everything can be unit-tested like rumsval.ts.
// Notes are private: they never affect room selection, public search, AI or
// analytics (spec Privacy/AI Access).

/** A chapter bookmark in the reader: points to a chapter and carries the book name
 * so Sparat can render the row without an extra API call. */
export type ChapterBookmark = {
  workId: string
  bookSlug: string
  chapter: number
  bookName: string
  savedAt: number
}

/** Key for a chapter bookmark — same shape as the book id plus chapter. */
export const chapterKey = (workId: string, bookSlug: string, chapter: number): string =>
  `${workId}/${bookSlug}:${chapter}`

/** A saved item only carries when it was saved. `null` = migrated from an old
 * boolean without a known date; the date is optional in the preview card. */
export type SavedItem = { savedWhen: string | null }

/** Where a note belongs. `topic` = leftover topic records from the old
 * app; extended later with `question`/`source` when they become saveable. */
export type Origin = 'room' | 'path' | 'topic'

/** A note tied to its origin. The key in the store = originId
 * (one note per place — today's UX). ISO 8601 dates, readable in the export. */
export type Note = {
  originType: Origin
  originId: string
  text: string
  created: string
  updated: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Canonical origin values plus the Swedish values an earlier version stored,
// normalized to the new ones on load so an upgrade never loses an origin.
const ORIGIN_ALIAS: Record<string, Origin> = {
  room: 'room',
  path: 'path',
  topic: 'topic',
  rum: 'room',
  vandring: 'path',
  amne: 'topic',
}

const toOrigin = (value: unknown): Origin | undefined =>
  typeof value === 'string' ? ORIGIN_ALIAS[value] : undefined

// A saved item from unknown storage: old `true` → migrated without a date, old
// `false` is dropped, already-migrated `{ savedWhen }` passes untouched (the Swedish
// key `sparadNar` is read as a fallback). Everything else is dropped.
const migrateSavedItem = (value: unknown): SavedItem | null => {
  if (value === true) return { savedWhen: null }
  if (isRecord(value)) {
    const savedWhen = 'savedWhen' in value ? value.savedWhen : value.sparadNar
    if (savedWhen === null || typeof savedWhen === 'string') return { savedWhen }
  }
  return null
}

/** Migrates a saved record (rooms or paths) quietly and losslessly.
 * Idempotent: already-migrated form passes through unchanged. Never throws. */
export const migrateSaved = (raw: unknown): Record<string, SavedItem> => {
  const out: Record<string, SavedItem> = {}
  if (!isRecord(raw)) return out
  for (const [id, value] of Object.entries(raw)) {
    const item = migrateSavedItem(value)
    if (item) out[id] = item
  }
  return out
}

// An already-migrated note from unknown storage, defensively narrowed. Fields that
// are missing or corrupt get safe fallbacks — the text is always preserved.
const migrateNoteItem = (id: string, value: unknown, now: string): Note | null => {
  if (!isRecord(value)) return null
  // Older stored notes carry the Swedish timestamp keys `skapad`/
  // `uppdaterad`; read them as a fallback so an upgrade never resets the
  // chronology (the notes view sorts on `updated`, import conflicts are decided on it).
  // New keys first, the Swedish ones (originType/originId were called ursprungTyp/ursprungId)
  // as a fallback so an upgrade never loses a note.
  const { originType, originId, ursprungTyp, ursprungId, text, created, updated, skapad, uppdaterad } =
    value
  if (typeof text !== 'string' || text.trim().length === 0) return null
  const firstString = (a: unknown, b: unknown): string =>
    typeof a === 'string' ? a : typeof b === 'string' ? b : now
  return {
    originType: toOrigin(originType) ?? toOrigin(ursprungTyp) ?? 'topic',
    originId:
      typeof originId === 'string' ? originId : typeof ursprungId === 'string' ? ursprungId : id,
    text,
    created: firstString(created, skapad),
    updated: firstString(updated, uppdaterad),
  }
}

// Old `notes` (id→text) → origin-linked records; empty ones are pruned.
const itemsFromOldNotes = (
  oldNotes: unknown,
  classify: (id: string) => Origin,
  now: string,
): Record<string, Note> => {
  const out: Record<string, Note> = {}
  if (!isRecord(oldNotes)) return out
  for (const [id, value] of Object.entries(oldNotes)) {
    if (typeof value !== 'string' || value.trim().length === 0) continue
    out[id] = { originType: classify(id), originId: id, text: value, created: now, updated: now }
  }
  return out
}

// Already-migrated records from unknown storage, defensively narrowed.
const itemsFromMigrated = (newNotes: unknown, now: string): Record<string, Note> => {
  const out: Record<string, Note> = {}
  if (!isRecord(newNotes)) return out
  for (const [id, value] of Object.entries(newNotes)) {
    const item = migrateNoteItem(id, value, now)
    if (item) out[id] = item
  }
  return out
}

/** Migrates notes quietly and losslessly: old `notes` (id→text) become
 * origin-linked records via `klassificera`, already-migrated records win
 * (the spread order). Empty notes are pruned. Never throws — private data
 * must never be lost on an upgrade. */
export const migrateNotes = (
  oldNotes: unknown,
  newNotes: unknown,
  classify: (id: string) => Origin,
  now: string,
): Record<string, Note> => ({
  ...itemsFromOldNotes(oldNotes, classify, now),
  ...itemsFromMigrated(newNotes, now),
})

/** Builds the note's new state on a write: `created` is preserved from
 * the existing record (autosave without visible version history), `updated`
 * is moved forward. */
export const updatedNote = (
  existing: Note | undefined,
  type: Origin,
  id: string,
  text: string,
  now: string,
): Note => ({
  originType: type,
  originId: id,
  text,
  created: existing?.created ?? now,
  updated: now,
})

/** Saved items in chronological order: most recently saved first. Migrated items
 * without a date (`sparadNar === null`) sort last via an empty key. */
export const savedIdsByTime = (items: Record<string, SavedItem>): string[] => {
  const key = (id: string): string => items[id]?.savedWhen ?? ''
  return Object.keys(items).sort((a, b) => key(b).localeCompare(key(a)))
}

/** The notes overview's order: most recently changed first, empty ones omitted
 * (spec Notes Overview: calmly chronological). ISO 8601 is compared lexically. */
export const sortedNotes = (notes: Record<string, Note>): Note[] =>
  Object.values(notes)
    .filter((note) => note.text.trim().length > 0)
    .sort((a, b) => b.updated.localeCompare(a.updated))

/** Short excerpt for preview cards; trims generously and invisibly (spec Note Length). */
export const excerpt = (text: string, max = 72): string => {
  const cleaned = text.trim()
  return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned
}

/** Quiet Swedish date for the »sparad« row, or nothing for an unknown/invalid date. */
export const dateLabel = (iso: string | null): string | undefined => {
  if (!iso) return undefined
  const time = new Date(iso)
  if (Number.isNaN(time.getTime())) return undefined
  return new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' }).format(time)
}
