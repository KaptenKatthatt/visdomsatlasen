// Korsvalidering av hela innehållsmängden (roadmap fas 2, Content Validation):
// dubbletter, brutna relationer och publiceringskrav. Fältkraven per post tas
// av zod-schemana vid tolkningen; här kontrolleras det som kräver helheten.
// Publicerat innehåll får aldrig peka på opublicerat — utkast är fria.
import { isTeaserOpening } from './openingGuard'
import type { Question, ContentSet, Source, SourcePassage, Room, Theme } from './schema'

type Kallrelation = Room['sources'][number]

type Lookup = {
  rooms: Map<string, Room>
  themes: Map<string, Theme>
  questions: Map<string, Question>
  sourceStatus: Map<string, string>
  passages: Map<string, SourcePassage>
  traditionStatus: Map<string, string>
}

const perId = <T extends { id: string }>(poster: T[]): Map<string, T> =>
  new Map(poster.map((post) => [post.id, post]))

const dublettfel = (type: string, poster: { id: string; slug?: string }[]): string[] => {
  const fel: string[] = []
  const seddaId = new Set<string>()
  const seddaSluggar = new Set<string>()
  for (const post of poster) {
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

const roomReferences = (rum: Room, uppslag: Lookup): Reference[] => {
  const fråga = (type: string, id: string): Reference => ({
    type,
    id,
    finns: uppslag.questions.has(id),
    publicerad: publicerad(uppslag.questions.get(id)?.status),
  })
  return [
    fråga('primär fråga', rum.primaryQuestion),
    ...(rum.relatedQuestions ?? []).map((id) => fråga('relaterad fråga', id)),
    ...rum.themes.map((id): Reference => ({
      type: 'tema',
      id,
      finns: uppslag.themes.has(id),
      publicerad: publicerad(uppslag.themes.get(id)?.status),
    })),
    ...rum.sources.map((relation): Reference => ({
      type: 'source',
      id: relation.source,
      finns: uppslag.sourceStatus.has(relation.source),
      publicerad: publicerad(uppslag.sourceStatus.get(relation.source)),
    })),
    ...rum.sources
      .filter((relation) => relation.passage !== undefined)
      .map((relation): Reference => ({
        type: 'källpassage',
        id: relation.passage ?? '',
        finns: uppslag.passages.has(relation.passage ?? ''),
        publicerad: publicerad(uppslag.passages.get(relation.passage ?? '')?.status),
      })),
  ]
}

const relationsfel = (rum: Room, uppslag: Lookup): string[] =>
  roomReferences(rum, uppslag)
    .filter((reference) => !reference.finns)
    .map((reference) => `rum ${rum.id}: ${reference.type} "${reference.id}" finns inte`)

// Citat och egen translation kräver en källpassage med exakt reference och
// edition (source-and-context.md, Types of Source Use): så hålls källans ord
// belagda och åtskilda från redaktionell prosa. Bearbetning/parafras/inspiration
// får nöja sig med fritextreferens och passerar orörda.
const REQUIRES_PASSAGE: ReadonlySet<Kallrelation['use']> = new Set(['quote', 'translation'])

const bruksgrind = (rum: Room, relation: Kallrelation, uppslag: Lookup): string[] => {
  if (!REQUIRES_PASSAGE.has(relation.use)) return []
  const mark = `rum ${rum.id}: ${relation.use}`
  if (relation.passage === undefined)
    return [`${mark} kräver en källpassage med exakt reference och edition`]
  const passage = uppslag.passages.get(relation.passage)
  if (!passage) return [] // saknad passage rapporteras redan som bruten relation
  return [
    ...(passage.edition ? [] : [`${mark} kräver edition (edition) på passagen "${passage.id}"`]),
    ...(relation.use === 'translation' && !passage.translator
      ? [`${mark} kräver angiven translator på passagen "${passage.id}"`]
      : []),
  ]
}

// Publiceringskraven (source-and-context.md Publication Gate, room-schema.md).
const publishError = (rum: Room, uppslag: Lookup): string[] => {
  if (!publicerad(rum.status)) return []
  const grindar = [
    ...(rum.sources.some((relation) => relation.primary)
      ? []
      : [`rum ${rum.id}: publicerat rum saknar primary source`]),
    ...(rum.readingTimeMinutes <= 10
      ? []
      : [`rum ${rum.id}: lästid ${rum.readingTimeMinutes} min utanför 1–10 för publicerat rum`]),
    ...rum.sources.flatMap((relation) => bruksgrind(rum, relation, uppslag)),
  ]
  const opublicerade = roomReferences(rum, uppslag)
    .filter((reference) => reference.finns && !reference.publicerad)
    .map((reference) => `rum ${rum.id}: länkar opublicerad(t) ${reference.type} "${reference.id}"`)
  return [...grindar, ...opublicerade]
}

// Språkgrind (review-language.md): öppningen ska landa i vardagen, inte teasa
// eller introducera källan (det gör Kärnan). Gäller alla rum, även utkast, så en
// teaser aldrig ens kan committas — inte bara stoppas vid publicering.
const openingError = (rum: Room): string[] =>
  isTeaserOpening(rum.opening)
    ? [
        `rum ${rum.id}: öppningens sista stycke teasar/introducerar källan — låt öppningen landa i det vardagliga (eller en öppen fråga) och Kärnan introducera källan (review-language.md)`,
      ]
    : []

const themeError = (tema: Theme, uppslag: Lookup): string[] => {
  if (tema.defaultRoom === undefined) return []
  const rum = uppslag.rooms.get(tema.defaultRoom)
  if (!rum) return [`tema ${tema.id}: standardrum "${tema.defaultRoom}" finns inte`]
  const fel: string[] = []
  if (!rum.themes.includes(tema.id))
    fel.push(`tema ${tema.id}: standardrummet "${rum.id}" tillhör inte temat`)
  if (publicerad(tema.status) && !publicerad(rum.status))
    fel.push(`tema ${tema.id}: publicerat tema har opublicerat standardrum "${rum.id}"`)
  return fel
}

// Samma grindprincip som rummen: en publicerad fråga är en synlig ingång
// i biblioteket och får inte leda till opublicerat innehåll.
const questionReference = (
  fråga: Question,
  type: string,
  id: string,
  post: { status: string } | undefined,
): string[] => {
  if (!post) return [`fråga ${fråga.id}: ${type} "${id}" finns inte`]
  if (publicerad(fråga.status) && !publicerad(post.status))
    return [`fråga ${fråga.id}: publicerad fråga länkar opublicerad(t) ${type} "${id}"`]
  return []
}

const questionError = (fråga: Question, uppslag: Lookup): string[] => [
  ...fråga.themes.flatMap((id) => questionReference(fråga, 'tema', id, uppslag.themes.get(id))),
  ...(fråga.relatedQuestions ?? []).flatMap((id) =>
    questionReference(fråga, 'relaterad fråga', id, uppslag.questions.get(id)),
  ),
]

const pathError = (mängd: ContentSet, uppslag: Lookup): string[] =>
  mängd.paths.flatMap((vandring) => {
    const fel: string[] = []
    // Central fråga: samma grind som rummen — en publicerad vandring är en
    // synlig ingång och får inte länka en opublicerad fråga.
    const central = uppslag.questions.get(vandring.centralQuestion)
    if (!central)
      fel.push(`vandring ${vandring.id}: central fråga "${vandring.centralQuestion}" finns inte`)
    else if (publicerad(vandring.status) && !publicerad(central.status))
      fel.push(
        `vandring ${vandring.id}: publicerad vandring länkar opublicerad central fråga "${vandring.centralQuestion}"`,
      )
    for (const rumId of vandring.rooms) {
      const rum = uppslag.rooms.get(rumId)
      if (!rum) fel.push(`vandring ${vandring.id}: rum "${rumId}" finns inte`)
      else if (publicerad(vandring.status) && !publicerad(rum.status))
        fel.push(`vandring ${vandring.id}: publicerad vandring innehåller opublicerat rum "${rumId}"`)
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

const sourceTraditionError = (source: Source, uppslag: Lookup): string[] =>
  (source.traditions ?? []).flatMap((traditionId) => {
    if (!uppslag.traditionStatus.has(traditionId))
      return [`source ${source.id}: tradition "${traditionId}" finns inte`]
    if (publicerad(source.status) && !publicerad(uppslag.traditionStatus.get(traditionId)))
      return [`source ${source.id}: publicerad source länkar opublicerad tradition "${traditionId}"`]
    return []
  })

const sourceError = (mängd: ContentSet, uppslag: Lookup): string[] =>
  mängd.sources.flatMap((source) => [
    ...sourceTraditionError(source, uppslag),
    ...sourceUncertainty(source),
  ])

const passagefel = (mängd: ContentSet, uppslag: Lookup): string[] =>
  mängd.passages.flatMap((passage) =>
    uppslag.sourceStatus.has(passage.source)
      ? []
      : [`passage ${passage.id}: source "${passage.source}" finns inte`],
  )

/** Validerar relationer och publiceringskrav över hela innehållsmängden.
 * Tom lista = konsistent innehåll. */
export const validateContent = (mängd: ContentSet): string[] => {
  const uppslag: Lookup = {
    rooms: perId(mängd.rooms),
    themes: perId(mängd.themes),
    questions: perId(mängd.questions),
    sourceStatus: new Map(mängd.sources.map((source) => [source.id, source.status])),
    passages: perId(mängd.passages),
    traditionStatus: new Map(
      mängd.traditions.map((tradition) => [tradition.id, tradition.status]),
    ),
  }
  return [
    ...dublettfel('rum', mängd.rooms),
    ...dublettfel('tema', mängd.themes),
    ...dublettfel('fråga', mängd.questions),
    ...dublettfel('vandring', mängd.paths),
    ...dublettfel('source', mängd.sources),
    ...dublettfel('passage', mängd.passages),
    ...dublettfel('tradition', mängd.traditions),
    ...dublettfel('person', mängd.people),
    ...mängd.rooms.flatMap((rum) => relationsfel(rum, uppslag)),
    ...mängd.rooms.flatMap((rum) => openingError(rum)),
    ...mängd.rooms.flatMap((rum) => publishError(rum, uppslag)),
    ...mängd.themes.flatMap((tema) => themeError(tema, uppslag)),
    ...mängd.questions.flatMap((fråga) => questionError(fråga, uppslag)),
    ...pathError(mängd, uppslag),
    ...sourceError(mängd, uppslag),
    ...passagefel(mängd, uppslag),
  ]
}
