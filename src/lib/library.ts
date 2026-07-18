// The library's selection (roadmap phase 6, library.md): in the library's lists
// only published content may be shown — stricter than the threshold's theme filter
// (!== 'arkiverad'), which shows draft themes while awaiting their first room.
// Don't "fix" it the other way: drafts are reached only via direct link and are
// the editorial team's review view, never part of exploration.
import type {
  Question,
  Source,
  SourcePassage,
  Person,
  Room,
  Theme,
  Tradition,
  Path,
} from '../content/editorial/schema'

const onlyPublished = <T extends { status: Room['status'] }>(items: T[]): T[] =>
  items.filter((post) => post.status === 'published')

const svOrdning =
  <T,>(text: (post: T) => string) =>
  (a: T, b: T): number =>
    text(a).localeCompare(text(b), 'sv')

const SIST = Number.MAX_SAFE_INTEGER

/** Looks up id references and keeps the published records. */
export const publishedThrough = <T extends { status: Room['status'] }>(
  ids: string[],
  hitta: (id: string) => T | undefined,
): T[] =>
  ids.flatMap((id) => {
    const post = hitta(id)
    return post !== undefined && post.status === 'published' ? [post] : []
  })

/** The library's themes: published, in the same editorial order as the threshold. */
export const libraryThemes = (themes: Theme[]): Theme[] =>
  onlyPublished(themes).sort(
    (a, b) => (a.order ?? SIST) - (b.order ?? SIST) || svOrdning<Theme>((t) => t.label)(a, b),
  )

/** The finite room list: published rooms in Swedish title order. */
export const libraryRooms = (rooms: Room[]): Room[] =>
  onlyPublished(rooms).sort(svOrdning((r) => r.title))

/** The library's source records: published, in Swedish title order. */
export const librarySources = (sources: Source[]): Source[] =>
  onlyPublished(sources).sort(svOrdning((k) => k.title))

/** The traditions: published, in Swedish name order. A secondary entry point —
 * they help with context but don't own the questions (library.md). */
export const libraryTraditions = (traditions: Tradition[]): Tradition[] =>
  onlyPublished(traditions).sort(svOrdning((t) => t.name))

/** The library's people: published, in Swedish name order. Reference points,
 * never primary navigation (library.md, People and Authors). */
export const libraryPeople = (people: Person[]): Person[] =>
  onlyPublished(people).sort(svOrdning((p) => p.name))

/** The library's questions: published, in Swedish text order. */
export const libraryQuestions = (questions: Question[]): Question[] =>
  onlyPublished(questions).sort(svOrdning((f) => f.text))

const compareTitleSv = svOrdning<Room>((r) => r.title)

/** The question page's rooms: rooms that carry the question as their own claim
 * (primaryQuestion) come first; rooms that only point to it among relatedQuestions
 * broaden it afterward. A finite list — never a sequence. */
export const roomsForQuestion = (questionId: string, rooms: Room[]): Room[] => {
  const published = onlyPublished(rooms)
  const primary = published.filter((room) => room.primaryQuestion === questionId).sort(compareTitleSv)
  const relaterade = published
    .filter(
      (room) =>
        room.primaryQuestion !== questionId && (room.relatedQuestions ?? []).includes(questionId),
    )
    .sort(compareTitleSv)
  return [...primary, ...relaterade]
}

/** The theme page's questions: published questions tagged with the theme. */
export const questionsForTheme = (themeId: string, questions: Question[]): Question[] =>
  onlyPublished(questions)
    .filter((question) => question.themes.includes(themeId))
    .sort(svOrdning((f) => f.text))

/** The question's source material: the sources behind the question's rooms — the
 * question schema has no source references of its own, so the material is derived
 * from the rooms' relations. */
export const sourcesForQuestion = (questionId: string, rooms: Room[], sources: Source[]): Source[] => {
  const ids = new Set(
    roomsForQuestion(questionId, rooms).flatMap((room) =>
      room.sources.map((relation) => relation.source),
    ),
  )
  return librarySources(sources.filter((source) => ids.has(source.id)))
}

/** The library's paths: published, in Swedish title order (paths.md,
 * Discoverability — a quiet section, never highlighted). */
export const libraryPaths = (paths: Path[]): Path[] =>
  onlyPublished(paths).sort(svOrdning((v) => v.title))

/** The path's rooms in editorial order — the `rum` list IS the sequence
 * (paths.md, Data Requirements), so nothing is re-sorted. The rooms are kept
 * regardless of status: the validation gate ensures a published path only holds
 * published rooms, and the draft path is the editorial team's review view where the
 * whole sequence should be readable. Missing ids (editorial error) are quietly skipped. */
export const roomsForPath = (path: Path, rooms: Room[]): Room[] =>
  path.rooms.flatMap((id) => {
    const hit = rooms.find((room) => room.id === id)
    return hit ? [hit] : []
  })

/** Approximate total reading time for the path's rooms (paths.md, Path Overview). */
export const pathReadingTime = (rooms: Room[]): number =>
  rooms.reduce((sum, room) => sum + room.readingTimeMinutes, 0)

/** The path's traditions, quietly derived from the rooms' sources (paths.md,
 * source traditions shown quietly): room → source → traditions, published
 * only, unique, in Swedish name order. */
export const traditionsForPath = (
  pathRooms: Room[],
  sources: Source[],
  traditions: Tradition[],
): Tradition[] => {
  const sourceIds = new Set(
    pathRooms.flatMap((room) => room.sources.map((relation) => relation.source)),
  )
  const traditionIds = new Set(
    sources
      .filter((source) => sourceIds.has(source.id))
      .flatMap((source) => source.traditions ?? []),
  )
  return libraryTraditions(traditions.filter((tradition) => traditionIds.has(tradition.id)))
}

/** The source's published passages, in natural reference order (»avsnitt 5« before
 * »avsnitt 43«, not the reverse). Only published passages reach the library;
 * drafts are the editorial team's review view. */
export const passagesForSource = (sourceId: string, passager: SourcePassage[]): SourcePassage[] =>
  onlyPublished(passager)
    .filter((passage) => passage.source === sourceId)
    .sort((a, b) => a.reference.localeCompare(b.reference, 'sv', { numeric: true }))

/** Published rooms that use the source — rooms with a primary relation first. */
export const roomsForSource = (sourceId: string, rooms: Room[]): Room[] => {
  const primaryWeight = (room: Room): number =>
    room.sources.some((relation) => relation.source === sourceId && relation.primary) ? 0 : 1
  return onlyPublished(rooms)
    .filter((room) => room.sources.some((relation) => relation.source === sourceId))
    .sort((a, b) => primaryWeight(a) - primaryWeight(b) || compareTitleSv(a, b))
}
