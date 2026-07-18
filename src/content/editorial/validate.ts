// Korsvalidering av hela innehållsmängden (roadmap fas 2, Content Validation):
// dubbletter, brutna relationer och publiceringskrav. Fältkraven per post tas
// av zod-schemana vid tolkningen; här kontrolleras det som kräver helheten.
// Publicerat innehåll får aldrig peka på opublicerat — utkast är fria.
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

// En refererad post: finns den, och (för publicerade rum) är den publicerad?
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

// Citat och egen translation kräver en källpassage med exakt reference och
// edition (source-and-context.md, Types of Source Use): så hålls källans ord
// belagda och åtskilda från redaktionell prosa. Bearbetning/parafras/inspiration
// får nöja sig med fritextreferens och passerar orörda.
const REQUIRES_PASSAGE: ReadonlySet<SourceRelation['use']> = new Set(['quote', 'translation'])

const sourceUseError = (room: Room, relation: SourceRelation, lookup: Lookup): string[] => {
  if (!REQUIRES_PASSAGE.has(relation.use)) return []
  const mark = `rum ${room.id}: ${relation.use}`
  if (relation.passage === undefined)
    return [`${mark} kräver en källpassage med exakt reference och edition`]
  const passage = lookup.passages.get(relation.passage)
  if (!passage) return [] // saknad passage rapporteras redan som bruten relation
  return [
    ...(passage.edition ? [] : [`${mark} kräver edition (edition) på passagen "${passage.id}"`]),
    ...(relation.use === 'translation' && !passage.translator
      ? [`${mark} kräver angiven translator på passagen "${passage.id}"`]
      : []),
  ]
}

// Publiceringskraven (source-and-context.md Publication Gate, room-schema.md).
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
  const opublicerade = roomReferences(room, lookup)
    .filter((reference) => reference.finns && !reference.publicerad)
    .map((reference) => `rum ${room.id}: länkar opublicerad(t) ${reference.type} "${reference.id}"`)
  return [...grindar, ...opublicerade]
}

// Språkgrind (review-language.md): öppningen ska landa i vardagen, inte teasa
// eller introducera källan (det gör Kärnan). Gäller alla rum, även utkast, så en
// teaser aldrig ens kan committas — inte bara stoppas vid publicering.
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

// Samma grindprincip som rummen: en publicerad fråga är en synlig ingång
// i biblioteket och får inte leda till opublicerat innehåll.
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
    // Central fråga: samma grind som rummen — en publicerad vandring är en
    // synlig ingång och får inte länka en opublicerad fråga.
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

// En publicerad source måste ta ställning till attribution och dating (även svaret
// "okänt"/"omtvistat") så osäkerhet representeras i stället för att döljas
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

/** Validerar relationer och publiceringskrav över hela innehållsmängden.
 * Tom lista = konsistent innehåll. */
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
