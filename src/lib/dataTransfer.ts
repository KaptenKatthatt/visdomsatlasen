// Export, import and merging of personal data (notes-and-saved.md,
// Export/Import). Pure logic without React/localStorage — everything round-trippable
// and unit-testable. JSON is canonical (re-importable); Markdown is a readable
// mirror. The reader's reflections should never be locked into an implementation.
import { z } from 'zod'
import {
  chapterKey,
  sortedNotes,
  savedIdsByTime,
  type Note,
  type ChapterBookmark,
  type SavedItem,
  type Origin,
} from './personal'

export const EXPORT_FORMAT = 'visdomsatlasen-personligt'

/** The personal part of the store — what gets exported, imported and cleared. */
export type PersonalCollections = {
  notes: Record<string, Note>
  savedRooms: Record<string, SavedItem>
  savedPaths: Record<string, SavedItem>
  bookmarks: Record<string, boolean>
  chapterBookmarks: Record<string, ChapterBookmark>
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

// Older v1 exports (same format/version) carry the Swedish keys an earlier
// version wrote: the note fields' `ursprungTyp`/`ursprungId` (with the values
// `rum`/`vandring`/`amne`) and the timestamps `skapad`/`uppdaterad`. Map them
// to the English names/values before validation so an earlier backup
// can still be imported without losing notes.
const LEGACY_ORIGIN: Record<string, string> = { rum: 'room', vandring: 'path', amne: 'topic' }

const withLegacyNote = (v: unknown): unknown => {
  if (!isRecord(v)) return v
  const originType = v.originType ?? v.ursprungTyp
  return {
    ...v,
    originType:
      typeof originType === 'string' ? (LEGACY_ORIGIN[originType] ?? originType) : originType,
    originId: v.originId ?? v.ursprungId,
    created: v.created ?? v.skapad,
    updated: v.updated ?? v.uppdaterad,
  }
}

const noteSchema = z.preprocess(
  withLegacyNote,
  z.object({
    originType: z.enum(['room', 'path', 'topic']),
    originId: z.string(),
    text: z.string(),
    created: z.string(),
    updated: z.string(),
    title: z.string().optional(),
  }),
)

// Older exports carry `sparadNar` instead of `savedWhen`.
const withLegacySaved = (v: unknown): unknown =>
  isRecord(v) ? { ...v, savedWhen: 'savedWhen' in v ? v.savedWhen : v.sparadNar } : v

const savedSchema = z.preprocess(
  withLegacySaved,
  z.object({
    id: z.string(),
    title: z.string().optional(),
    savedWhen: z.string().nullable(),
  }),
)

const chapterSchema = z.object({
  workId: z.string(),
  bookSlug: z.string(),
  chapter: z.number(),
  bookName: z.string(),
  savedAt: z.number(),
})

// Older exports carry the Swedish container keys (exporterad/anteckningar/
// sparadeRum/sparadeVandringar/bokmarken{kapitel,amnen}); map them to the
// English names before validation so an earlier backup still imports.
const withLegacyExport = (v: unknown): unknown => {
  if (!isRecord(v)) return v
  const bookmarks = v.bookmarks ?? v.bokmarken
  return {
    ...v,
    exported: v.exported ?? v.exporterad,
    notes: v.notes ?? v.anteckningar,
    savedRooms: v.savedRooms ?? v.sparadeRum,
    savedPaths: v.savedPaths ?? v.sparadeVandringar,
    bookmarks: isRecord(bookmarks)
      ? {
          ...bookmarks,
          chapters: bookmarks.chapters ?? bookmarks.kapitel,
          topics: bookmarks.topics ?? bookmarks.amnen,
        }
      : bookmarks,
  }
}

// The version field makes future formats distinguishable; the format literal
// makes foreign files get rejected instead of misinterpreted.
const exportSchema = z.preprocess(
  withLegacyExport,
  z.object({
    format: z.literal(EXPORT_FORMAT),
    version: z.literal(1),
    exported: z.string(),
    notes: z.array(noteSchema),
    savedRooms: z.array(savedSchema),
    savedPaths: z.array(savedSchema),
    bookmarks: z.object({ chapters: z.array(chapterSchema), topics: z.array(z.string()) }),
  }),
)

export type PersonalExport = z.infer<typeof exportSchema>
type ExportSparad = z.infer<typeof savedSchema>

const savedItems = (
  items: Record<string, SavedItem>,
  titleFor: (id: string) => string | undefined,
): ExportSparad[] =>
  savedIdsByTime(items).map((id) => ({
    id,
    title: titleFor(id),
    savedWhen: items[id]?.savedWhen ?? null,
  }))

/** Builds an export record. `titelFor` looks up readable titles for the notes'
 * origins and the saved items, so the export can be read standalone. */
export const toExport = (
  collections: PersonalCollections,
  titleFor: (type: Origin, id: string) => string | undefined,
  now: string,
): PersonalExport => ({
  format: EXPORT_FORMAT,
  version: 1,
  exported: now,
  notes: sortedNotes(collections.notes).map((item) => ({
    ...item,
    title: titleFor(item.originType, item.originId),
  })),
  savedRooms: savedItems(collections.savedRooms, (id) => titleFor('room', id)),
  savedPaths: savedItems(collections.savedPaths, (id) => titleFor('path', id)),
  bookmarks: {
    chapters: Object.values(collections.chapterBookmarks),
    topics: Object.keys(collections.bookmarks).filter((id) => collections.bookmarks[id]),
  },
})

/** Parses an import file. Wrong format, wrong version or corrupt JSON → null, so
 * the caller can show a quiet error message without anything breaking. */
export const readImport = (json: unknown): PersonalExport | null => {
  const result = exportSchema.safeParse(json)
  return result.success ? result.data : null
}

// Note conflict: the most recently updated wins (spec: conflicts are resolved safely).
const mergeNotes = (
  current: Record<string, Note>,
  imported: PersonalExport['notes'],
): Record<string, Note> => {
  const out = { ...current }
  for (const item of imported) {
    const existing = out[item.originId]
    if (existing !== undefined && existing.updated >= item.updated) continue
    out[item.originId] = {
      originType: item.originType,
      originId: item.originId,
      text: item.text,
      created: item.created,
      updated: item.updated,
    }
  }
  return out
}

const mergeSaved = (
  current: Record<string, SavedItem>,
  imported: ExportSparad[],
): Record<string, SavedItem> => {
  const out = { ...current }
  for (const item of imported) {
    if (out[item.id] === undefined) out[item.id] = { savedWhen: item.savedWhen }
  }
  return out
}

const mergaBookmarks = (current: Record<string, boolean>, topicIds: string[]): Record<string, boolean> => {
  const out = { ...current }
  for (const id of topicIds) out[id] = true
  return out
}

const mergeChapterBookmarks = (
  current: Record<string, ChapterBookmark>,
  chapters: ChapterBookmark[],
): Record<string, ChapterBookmark> => {
  const out = { ...current }
  for (const bookmark of chapters) out[chapterKey(bookmark.workId, bookmark.bookSlug, bookmark.chapter)] = bookmark
  return out
}

/** Merges an import with the current data (spec: the local copy stays usable,
 * conflicts are resolved safely). Union of saved items and bookmarks; notes
 * are resolved with newest-wins. Never destructive toward existing data. */
export const mergeImport = (
  current: PersonalCollections,
  incoming: PersonalExport,
): PersonalCollections => ({
  notes: mergeNotes(current.notes, incoming.notes),
  savedRooms: mergeSaved(current.savedRooms, incoming.savedRooms),
  savedPaths: mergeSaved(current.savedPaths, incoming.savedPaths),
  bookmarks: mergaBookmarks(current.bookmarks, incoming.bookmarks.topics),
  chapterBookmarks: mergeChapterBookmarks(current.chapterBookmarks, incoming.bookmarks.chapters),
})

const noteToMarkdown = (item: PersonalExport['notes'][number]): string =>
  [
    `## ${item.title ?? 'Anteckning'}`,
    '',
    item.text,
    '',
    `_Skapad ${item.created} · uppdaterad ${item.updated}_`,
  ].join('\n')

/** Readable Markdown mirror of the export (spec prefers open formats). Not
 * re-importable — JSON is the round-trip format. */
export const toMarkdown = (exporten: PersonalExport): string => {
  const parts: string[] = ['# Visdomsatlasen — mina anteckningar och sparat', '']
  if (exporten.notes.length > 0) {
    parts.push('# Anteckningar', '')
    for (const item of exporten.notes) parts.push(noteToMarkdown(item), '')
  }
  const saved = [...exporten.savedRooms, ...exporten.savedPaths]
  if (saved.length > 0) {
    parts.push('# Sparat', '')
    for (const item of saved) parts.push(`- ${item.title ?? item.id}`)
    parts.push('')
  }
  return parts.join('\n')
}
