// Korsvalidering av hela innehållsmängden (roadmap fas 2, Content Validation):
// dubbletter, brutna relationer och publiceringskrav. Fältkraven per post tas
// av zod-schemana vid tolkningen; här kontrolleras det som kräver helheten.
// Publicerat innehåll får aldrig peka på opublicerat — utkast är fria.
import { ärTeaseröppning } from './oppningsvakt'
import type { Question, ContentSet, Source, SourcePassage, Room, Theme } from './schema'

type Kallrelation = Room['sources'][number]

type Lookup = {
  rum: Map<string, Room>
  themes: Map<string, Theme>
  frågor: Map<string, Question>
  källstatus: Map<string, string>
  passager: Map<string, SourcePassage>
  traditionsstatus: Map<string, string>
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

const publicerad = (status: string | undefined): boolean => status === 'publicerad'

// En refererad post: finns den, och (för publicerade rum) är den publicerad?
type Reference = { type: string; id: string; finns: boolean; publicerad: boolean }

const rumsreferenser = (rum: Room, uppslag: Lookup): Reference[] => {
  const fråga = (type: string, id: string): Reference => ({
    type,
    id,
    finns: uppslag.frågor.has(id),
    publicerad: publicerad(uppslag.frågor.get(id)?.status),
  })
  return [
    fråga('primary fråga', rum.primaryQuestion),
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
      finns: uppslag.källstatus.has(relation.source),
      publicerad: publicerad(uppslag.källstatus.get(relation.source)),
    })),
    ...rum.sources
      .filter((relation) => relation.passage !== undefined)
      .map((relation): Reference => ({
        type: 'källpassage',
        id: relation.passage ?? '',
        finns: uppslag.passager.has(relation.passage ?? ''),
        publicerad: publicerad(uppslag.passager.get(relation.passage ?? '')?.status),
      })),
  ]
}

const relationsfel = (rum: Room, uppslag: Lookup): string[] =>
  rumsreferenser(rum, uppslag)
    .filter((reference) => !reference.finns)
    .map((reference) => `rum ${rum.id}: ${reference.type} "${reference.id}" finns inte`)

// Citat och egen translation kräver en källpassage med exakt reference och
// edition (source-and-context.md, Types of Source Use): så hålls källans ord
// belagda och åtskilda från redaktionell prosa. Bearbetning/parafras/inspiration
// får nöja sig med fritextreferens och passerar orörda.
const KRÄVER_PASSAGE: ReadonlySet<Kallrelation['use']> = new Set(['citat', 'translation'])

const bruksgrind = (rum: Room, relation: Kallrelation, uppslag: Lookup): string[] => {
  if (!KRÄVER_PASSAGE.has(relation.use)) return []
  const märke = `rum ${rum.id}: ${relation.use}`
  if (relation.passage === undefined)
    return [`${märke} kräver en källpassage med exakt reference och edition`]
  const passage = uppslag.passager.get(relation.passage)
  if (!passage) return [] // saknad passage rapporteras redan som bruten relation
  return [
    ...(passage.edition ? [] : [`${märke} kräver edition (edition) på passagen "${passage.id}"`]),
    ...(relation.use === 'translation' && !passage.translator
      ? [`${märke} kräver angiven translator på passagen "${passage.id}"`]
      : []),
  ]
}

// Publiceringskraven (source-and-context.md Publication Gate, room-schema.md).
const publiceringsfel = (rum: Room, uppslag: Lookup): string[] => {
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
  const opublicerade = rumsreferenser(rum, uppslag)
    .filter((reference) => reference.finns && !reference.publicerad)
    .map((reference) => `rum ${rum.id}: länkar opublicerad(t) ${reference.type} "${reference.id}"`)
  return [...grindar, ...opublicerade]
}

// Språkgrind (review-language.md): öppningen ska landa i vardagen, inte teasa
// eller introducera källan (det gör Kärnan). Gäller alla rum, även utkast, så en
// teaser aldrig ens kan committas — inte bara stoppas vid publicering.
const öppningsfel = (rum: Room): string[] =>
  ärTeaseröppning(rum.opening)
    ? [
        `rum ${rum.id}: öppningens sista stycke teasar/introducerar källan — låt öppningen landa i det vardagliga (eller en öppen fråga) och Kärnan introducera källan (review-language.md)`,
      ]
    : []

const temafel = (tema: Theme, uppslag: Lookup): string[] => {
  if (tema.defaultRoom === undefined) return []
  const rum = uppslag.rum.get(tema.defaultRoom)
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
const fragereferens = (
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

const fragefel = (fråga: Question, uppslag: Lookup): string[] => [
  ...fråga.themes.flatMap((id) => fragereferens(fråga, 'tema', id, uppslag.themes.get(id))),
  ...(fråga.relatedQuestions ?? []).flatMap((id) =>
    fragereferens(fråga, 'relaterad fråga', id, uppslag.frågor.get(id)),
  ),
]

const vandringsfel = (mängd: ContentSet, uppslag: Lookup): string[] =>
  mängd.vandringar.flatMap((vandring) => {
    const fel: string[] = []
    // Central fråga: samma grind som rummen — en publicerad vandring är en
    // synlig ingång och får inte länka en opublicerad fråga.
    const central = uppslag.frågor.get(vandring.centralQuestion)
    if (!central)
      fel.push(`vandring ${vandring.id}: central fråga "${vandring.centralQuestion}" finns inte`)
    else if (publicerad(vandring.status) && !publicerad(central.status))
      fel.push(
        `vandring ${vandring.id}: publicerad vandring länkar opublicerad central fråga "${vandring.centralQuestion}"`,
      )
    for (const rumId of vandring.rum) {
      const rum = uppslag.rum.get(rumId)
      if (!rum) fel.push(`vandring ${vandring.id}: rum "${rumId}" finns inte`)
      else if (publicerad(vandring.status) && !publicerad(rum.status))
        fel.push(`vandring ${vandring.id}: publicerad vandring innehåller opublicerat rum "${rumId}"`)
    }
    return fel
  })

// En publicerad source måste ta ställning till attribution och dating (även svaret
// "okänt"/"omtvistat") så osäkerhet representeras i stället för att döljas
// (source-and-context.md, Uncertainty; Publication Gate).
const kallosakerhet = (source: Source): string[] =>
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

const kalltraditionsfel = (source: Source, uppslag: Lookup): string[] =>
  (source.traditions ?? []).flatMap((traditionId) => {
    if (!uppslag.traditionsstatus.has(traditionId))
      return [`source ${source.id}: tradition "${traditionId}" finns inte`]
    if (publicerad(source.status) && !publicerad(uppslag.traditionsstatus.get(traditionId)))
      return [`source ${source.id}: publicerad source länkar opublicerad tradition "${traditionId}"`]
    return []
  })

const kallfel = (mängd: ContentSet, uppslag: Lookup): string[] =>
  mängd.sources.flatMap((source) => [
    ...kalltraditionsfel(source, uppslag),
    ...kallosakerhet(source),
  ])

const passagefel = (mängd: ContentSet, uppslag: Lookup): string[] =>
  mängd.passager.flatMap((passage) =>
    uppslag.källstatus.has(passage.source)
      ? []
      : [`passage ${passage.id}: source "${passage.source}" finns inte`],
  )

/** Validerar relationer och publiceringskrav över hela innehållsmängden.
 * Tom lista = konsistent innehåll. */
export const valideraInnehall = (mängd: ContentSet): string[] => {
  const uppslag: Lookup = {
    rum: perId(mängd.rum),
    themes: perId(mängd.themes),
    frågor: perId(mängd.frågor),
    källstatus: new Map(mängd.sources.map((source) => [source.id, source.status])),
    passager: perId(mängd.passager),
    traditionsstatus: new Map(
      mängd.traditions.map((tradition) => [tradition.id, tradition.status]),
    ),
  }
  return [
    ...dublettfel('rum', mängd.rum),
    ...dublettfel('tema', mängd.themes),
    ...dublettfel('fråga', mängd.frågor),
    ...dublettfel('vandring', mängd.vandringar),
    ...dublettfel('source', mängd.sources),
    ...dublettfel('passage', mängd.passager),
    ...dublettfel('tradition', mängd.traditions),
    ...dublettfel('person', mängd.personer),
    ...mängd.rum.flatMap((rum) => relationsfel(rum, uppslag)),
    ...mängd.rum.flatMap((rum) => öppningsfel(rum)),
    ...mängd.rum.flatMap((rum) => publiceringsfel(rum, uppslag)),
    ...mängd.themes.flatMap((tema) => temafel(tema, uppslag)),
    ...mängd.frågor.flatMap((fråga) => fragefel(fråga, uppslag)),
    ...vandringsfel(mängd, uppslag),
    ...kallfel(mängd, uppslag),
    ...passagefel(mängd, uppslag),
  ]
}
