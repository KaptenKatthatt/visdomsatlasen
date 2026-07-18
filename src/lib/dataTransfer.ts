// Export, import och sammanslagning av personlig data (notes-and-saved.md,
// Export/Import). Ren logik utan React/localStorage — allt round-trip:bart och
// enhetstestbart. JSON är kanoniskt (återimporterbart); Markdown är en läsbar
// spegel. Läsarens reflektioner ska aldrig låsas in i en implementation.
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

/** Den personliga delen av storen — det som exporteras, importeras och rensas. */
export type PersonalCollections = {
  notes: Record<string, Note>
  savedRooms: Record<string, SavedItem>
  savedPaths: Record<string, SavedItem>
  bookmarks: Record<string, boolean>
  chapterBookmarks: Record<string, ChapterBookmark>
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

// Äldre v1-exporter (samma format/version) bär de svenska nycklarna en tidigare
// version skrev: anteckningsfältens `ursprungTyp`/`ursprungId` (med värdena
// `rum`/`vandring`/`amne`) och tidsstämplarna `skapad`/`uppdaterad`. Mappa dem
// till de engelska namnen/värdena före validering så en tidigare backup
// fortfarande går att importera utan att tappa anteckningar.
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

// Äldre exporter bär `sparadNar` i stället för `savedWhen`.
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

// Äldre exporter bär de svenska container-nycklarna (exporterad/anteckningar/
// sparadeRum/sparadeVandringar/bokmarken{kapitel,amnen}); mappa dem till de
// engelska namnen före validering så en tidigare backup fortfarande importeras.
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

// Versionsfältet gör framtida format skiljbara; format-literalen gör att
// främmande filer avvisas i stället för att tolkas fel.
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
  titelFor: (id: string) => string | undefined,
): ExportSparad[] =>
  savedIdsByTime(items).map((id) => ({
    id,
    title: titelFor(id),
    savedWhen: items[id]?.savedWhen ?? null,
  }))

/** Bygger en exportpost. `titelFor` slår upp läsbara titlar för anteckningarnas
 * ursprung och de sparade posterna, så exporten går att läsa fristående. */
export const toExport = (
  samlingar: PersonalCollections,
  titelFor: (type: Origin, id: string) => string | undefined,
  nu: string,
): PersonalExport => ({
  format: EXPORT_FORMAT,
  version: 1,
  exported: nu,
  notes: sortedNotes(samlingar.notes).map((post) => ({
    ...post,
    title: titelFor(post.originType, post.originId),
  })),
  savedRooms: savedItems(samlingar.savedRooms, (id) => titelFor('room', id)),
  savedPaths: savedItems(samlingar.savedPaths, (id) => titelFor('path', id)),
  bookmarks: {
    chapters: Object.values(samlingar.chapterBookmarks),
    topics: Object.keys(samlingar.bookmarks).filter((id) => samlingar.bookmarks[id]),
  },
})

/** Tolkar en importfil. Fel format, fel version eller korrupt JSON → null, så
 * anroparen kan visa ett stilla felbesked utan att något går sönder. */
export const readImport = (json: unknown): PersonalExport | null => {
  const resultat = exportSchema.safeParse(json)
  return resultat.success ? resultat.data : null
}

// Anteckningskonflikt: den nyast uppdaterade vinner (spec: konflikter löses säkert).
const mergeNotes = (
  current: Record<string, Note>,
  importerade: PersonalExport['notes'],
): Record<string, Note> => {
  const ut = { ...current }
  for (const post of importerade) {
    const existing = ut[post.originId]
    if (existing !== undefined && existing.updated >= post.updated) continue
    ut[post.originId] = {
      originType: post.originType,
      originId: post.originId,
      text: post.text,
      created: post.created,
      updated: post.updated,
    }
  }
  return ut
}

const mergeSaved = (
  current: Record<string, SavedItem>,
  importerade: ExportSparad[],
): Record<string, SavedItem> => {
  const ut = { ...current }
  for (const post of importerade) {
    if (ut[post.id] === undefined) ut[post.id] = { savedWhen: post.savedWhen }
  }
  return ut
}

const mergaBookmarks = (current: Record<string, boolean>, amnen: string[]): Record<string, boolean> => {
  const ut = { ...current }
  for (const id of amnen) ut[id] = true
  return ut
}

const mergeChapterBookmarks = (
  current: Record<string, ChapterBookmark>,
  kapitel: ChapterBookmark[],
): Record<string, ChapterBookmark> => {
  const ut = { ...current }
  for (const bookmark of kapitel) ut[chapterKey(bookmark.workId, bookmark.bookSlug, bookmark.chapter)] = bookmark
  return ut
}

/** Slår ihop en import med nuvarande data (spec: lokala kopian förblir användbar,
 * konflikter löses säkert). Union av sparade poster och bokmärken; anteckningar
 * löses med nyast-vinner. Aldrig destruktivt mot befintlig data. */
export const mergeImport = (
  current: PersonalCollections,
  importen: PersonalExport,
): PersonalCollections => ({
  notes: mergeNotes(current.notes, importen.notes),
  savedRooms: mergeSaved(current.savedRooms, importen.savedRooms),
  savedPaths: mergeSaved(current.savedPaths, importen.savedPaths),
  bookmarks: mergaBookmarks(current.bookmarks, importen.bookmarks.topics),
  chapterBookmarks: mergeChapterBookmarks(current.chapterBookmarks, importen.bookmarks.chapters),
})

const noteToMarkdown = (post: PersonalExport['notes'][number]): string =>
  [
    `## ${post.title ?? 'Anteckning'}`,
    '',
    post.text,
    '',
    `_Skapad ${post.created} · uppdaterad ${post.updated}_`,
  ].join('\n')

/** Läsbar Markdown-spegel av exporten (spec föredrar öppna format). Inte
 * återimporterbar — JSON är round-trip-formatet. */
export const toMarkdown = (exporten: PersonalExport): string => {
  const delar: string[] = ['# Visdomsatlasen — mina anteckningar och sparat', '']
  if (exporten.notes.length > 0) {
    delar.push('# Anteckningar', '')
    for (const post of exporten.notes) delar.push(noteToMarkdown(post), '')
  }
  const saved = [...exporten.savedRooms, ...exporten.savedPaths]
  if (saved.length > 0) {
    delar.push('# Sparat', '')
    for (const post of saved) delar.push(`- ${post.title ?? post.id}`)
    delar.push('')
  }
  return delar.join('\n')
}
