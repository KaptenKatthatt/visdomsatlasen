// Cross-validation of the entire content set (roadmap phase 2, Content Validation):
// duplicates, broken relations and publication requirements. Per-post field
// requirements are handled by the zod schemas during parsing; here we check what
// requires the whole. Published content may never point to unpublished — drafts are free.
import { isTeaserOpening } from './openingGuard'
import type { Question, ContentSet, Source, SourcePassage, Room, Theme } from './schema'

type SourceRelation = Room['sources'][number]

type Lookup = {
  rooms: Map<string, Room>
  themes: Map<string, Theme>
  questions: Map<string, Question>
  sourceStatus: Map<string, string>
  passages: Map<string, SourcePassage>
  traditionStatus: Map<string, string>
}

const perId = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((post) => [post.id, post]))

const duplicateError = (type: string, items: { id: string; slug?: string }[]): string[] => {
  const fel: string[] = []
  const seddaId = new Set<string>()
  const seddaSluggar = new Set<string>()
  for (const post of items) {
    if (seddaId.has(post.id)) fel.push(`${type} ${post.id}: dubblett av id "${post.id}"`)
    seddaId.add(post.id)
    if (post.slug !== undefined) {
      if (seddaSluggar.has(post.slug)) fel.push(`${type} ${post.id}: dubblett av slug "${post.slug}"`)
      seddaSluggar.add(post.slug)
    }
  }
  return fel
}

const publicerad = (status: string | undefined): boolean => status === 'published'

// A referenced post: does it exist, and (for published rooms) is it published?
type Reference = { type: string; id: string; finns: boolean; publicerad: boolean }

const roomReferences = (room: Room, lookup: Lookup): Reference[] => {
  const question = (type: string, id: string): Reference => ({
    type,
    id,
    finns: lookup.questions.has(id),
    publicerad: publicerad(lookup.questions.get(id)?.status),
  })
  return [
    question('primär fråga', room.primaryQuestion),
    ...(room.relatedQuestions ?? []).map((id) => question('relaterad fråga', id)),
    ...room.themes.map((id): Reference => ({
      type: 'tema',
      id,
      finns: lookup.themes.has(id),
      publicerad: publicerad(lookup.themes.get(id)?.status),
    })),
    ...room.sources.map((relation): Reference => ({
      type: 'source',
      id: relation.source,
      finns: lookup.sourceStatus.has(relation.source),
      publicerad: publicerad(lookup.sourceStatus.get(relation.source)),
    })),
    ...room.sources
      .filter((relation) => relation.passage !== undefined)
      .map((relation): Reference => ({
        type: 'källpassage',
        id: relation.passage ?? '',
        finns: lookup.passages.has(relation.passage ?? ''),
        publicerad: publicerad(lookup.passages.get(relation.passage ?? '')?.status),
      })),
  ]
}

const relationError = (room: Room, lookup: Lookup): string[] =>
  roomReferences(room, lookup)
    .filter((reference) => !reference.finns)
    .map((reference) => `rum ${room.id}: ${reference.type} "${reference.id}" finns inte`)

// Quotes and own translations require a source passage with an exact reference and
// edition (source-and-context.md, Types of Source Use): this keeps the source's words
// documented and separate from editorial prose. Adaptation/paraphrase/inspiration
// may make do with a free-text reference and pass untouched.
const REQUIRES_PASSAGE: ReadonlySet<SourceRelation['use']> = new Set(['quote', 'translation'])

const sourceUseError = (room: Room, relation: SourceRelation, lookup: Lookup): string[] => {
  if (!REQUIRES_PASSAGE.has(relation.use)) return []
  const mark = `rum ${room.id}: ${relation.use}`
  if (relation.passage === undefined)
    return [`${mark} kräver en källpassage med exakt reference och edition`]
  const passage = lookup.passages.get(relation.passage)
  if (!passage) return [] // a missing passage is already reported as a broken relation
  return [
    ...(passage.edition ? [] : [`${mark} kräver edition (edition) på passagen "${passage.id}"`]),
    ...(relation.use === 'translation' && !passage.translator
      ? [`${mark} kräver angiven translator på passagen "${passage.id}"`]
      : []),
  ]
}

// The publication requirements (source-and-context.md Publication Gate, room-schema.md).
const publishError = (room: Room, lookup: Lookup): string[] => {
  if (!publicerad(room.status)) return []
  const grindar = [
    ...(room.sources.some((relation) => relation.primary)
      ? []
      : [`rum ${room.id}: publicerat rum saknar primary source`]),
    ...(room.readingTimeMinutes <= 10
      ? []
      : [`rum ${room.id}: lästid ${room.readingTimeMinutes} min utanför 1–10 för publicerat rum`]),
    ...room.sources.flatMap((relation) => sourceUseError(room, relation, lookup)),
  ]
  const unpublished = roomReferences(room, lookup)
    .filter((reference) => reference.finns && !reference.publicerad)
    .map((reference) => `rum ${room.id}: länkar opublicerad(t) ${reference.type} "${reference.id}"`)
  return [...grindar, ...unpublished]
}

// Language gate (review-language.md): the opening should land in the everyday, not
// tease or introduce the source (the Core does that). Applies to all rooms, even
// drafts, so a teaser can never even be committed — not just stopped at publication.
const openingError = (room: Room): string[] =>
  isTeaserOpening(room.opening)
    ? [
        `rum ${room.id}: öppningens sista stycke teasar/introducerar källan — låt öppningen landa i det vardagliga (eller en öppen fråga) och Kärnan introducera källan (review-language.md)`,
      ]
    : []

const themeError = (theme: Theme, lookup: Lookup): string[] => {
  if (theme.defaultRoom === undefined) return []
  const room = lookup.rooms.get(theme.defaultRoom)
  if (!room) return [`tema ${theme.id}: standardrum "${theme.defaultRoom}" finns inte`]
  const fel: string[] = []
  if (!room.themes.includes(theme.id))
    fel.push(`tema ${theme.id}: standardrummet "${room.id}" tillhör inte temat`)
  if (publicerad(theme.status) && !publicerad(room.status))
    fel.push(`tema ${theme.id}: publicerat tema har opublicerat standardrum "${room.id}"`)
  return fel
}

// Same gate principle as the rooms: a published question is a visible entry point
// in the library and must not lead to unpublished content.
const questionReference = (
  question: Question,
  type: string,
  id: string,
  post: { status: string } | undefined,
): string[] => {
  if (!post) return [`fråga ${question.id}: ${type} "${id}" finns inte`]
  if (publicerad(question.status) && !publicerad(post.status))
    return [`fråga ${question.id}: publicerad fråga länkar opublicerad(t) ${type} "${id}"`]
  return []
}

const questionError = (question: Question, lookup: Lookup): string[] => [
  ...question.themes.flatMap((id) => questionReference(question, 'tema', id, lookup.themes.get(id))),
  ...(question.relatedQuestions ?? []).flatMap((id) =>
    questionReference(question, 'relaterad fråga', id, lookup.questions.get(id)),
  ),
]

const pathError = (set: ContentSet, lookup: Lookup): string[] =>
  set.paths.flatMap((path) => {
    const fel: string[] = []
    // Central question: same gate as the rooms — a published path is a visible
    // entry point and must not link an unpublished question.
    const central = lookup.questions.get(path.centralQuestion)
    if (!central)
      fel.push(`vandring ${path.id}: central fråga "${path.centralQuestion}" finns inte`)
    else if (publicerad(path.status) && !publicerad(central.status))
      fel.push(
        `vandring ${path.id}: publicerad vandring länkar opublicerad central fråga "${path.centralQuestion}"`,
      )
    for (const roomId of path.rooms) {
      const room = lookup.rooms.get(roomId)
      if (!room) fel.push(`vandring ${path.id}: rum "${roomId}" finns inte`)
      else if (publicerad(path.status) && !publicerad(room.status))
        fel.push(`vandring ${path.id}: publicerad vandring innehåller opublicerat rum "${roomId}"`)
    }
    return fel
  })

// A published source must take a stance on attribution and dating (even the answer
// "unknown"/"disputed") so uncertainty is represented rather than hidden
// (source-and-context.md, Uncertainty; Publication Gate).
const sourceUncertainty = (source: Source): string[] =>
  publicerad(source.status)
    ? [
        ...(source.attribution === undefined
          ? [`source ${source.id}: publicerad source saknar upphovsstatus (attribution)`]
          : []),
        ...(source.dating === undefined
          ? [`source ${source.id}: publicerad source saknar dateringsstatus (dating)`]
          : []),
      ]
    : []

const sourceTraditionError = (source: Source, lookup: Lookup): string[] =>
  (source.traditions ?? []).flatMap((traditionId) => {
    if (!lookup.traditionStatus.has(traditionId))
      return [`source ${source.id}: tradition "${traditionId}" finns inte`]
    if (publicerad(source.status) && !publicerad(lookup.traditionStatus.get(traditionId)))
      return [`source ${source.id}: publicerad source länkar opublicerad tradition "${traditionId}"`]
    return []
  })

const sourceError = (set: ContentSet, lookup: Lookup): string[] =>
  set.sources.flatMap((source) => [
    ...sourceTraditionError(source, lookup),
    ...sourceUncertainty(source),
  ])

const passageError = (set: ContentSet, lookup: Lookup): string[] =>
  set.passages.flatMap((passage) =>
    lookup.sourceStatus.has(passage.source)
      ? []
      : [`passage ${passage.id}: source "${passage.source}" finns inte`],
  )

/** Validates relations and publication requirements across the entire content set.
 * An empty list = consistent content. */
export const validateContent = (set: ContentSet): string[] => {
  const lookup: Lookup = {
    rooms: perId(set.rooms),
    themes: perId(set.themes),
    questions: perId(set.questions),
    sourceStatus: new Map(set.sources.map((source) => [source.id, source.status])),
    passages: perId(set.passages),
    traditionStatus: new Map(
      set.traditions.map((tradition) => [tradition.id, tradition.status]),
    ),
  }
  return [
    ...duplicateError('rum', set.rooms),
    ...duplicateError('tema', set.themes),
    ...duplicateError('fråga', set.questions),
    ...duplicateError('vandring', set.paths),
    ...duplicateError('source', set.sources),
    ...duplicateError('passage', set.passages),
    ...duplicateError('tradition', set.traditions),
    ...duplicateError('person', set.people),
    ...set.rooms.flatMap((room) => relationError(room, lookup)),
    ...set.rooms.flatMap((room) => openingError(room)),
    ...set.rooms.flatMap((room) => publishError(room, lookup)),
    ...set.themes.flatMap((theme) => themeError(theme, lookup)),
    ...set.questions.flatMap((question) => questionError(question, lookup)),
    ...pathError(set, lookup),
    ...sourceError(set, lookup),
    ...passageError(set, lookup),
  ]
}
