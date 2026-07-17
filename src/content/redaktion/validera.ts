// Korsvalidering av hela innehållsmängden (roadmap fas 2, Content Validation):
// dubbletter, brutna relationer och publiceringskrav. Fältkraven per post tas
// av zod-schemana vid tolkningen; här kontrolleras det som kräver helheten.
// Publicerat innehåll får aldrig peka på opublicerat — utkast är fria.
import { ärTeaseröppning } from './oppningsvakt'
import type { Fraga, Innehallsmangd, Kalla, Kallpassage, Rum, Tema } from './schema'

type Kallrelation = Rum['källor'][number]

type Uppslag = {
  rum: Map<string, Rum>
  teman: Map<string, Tema>
  frågor: Map<string, Fraga>
  källstatus: Map<string, string>
  passager: Map<string, Kallpassage>
  traditionsstatus: Map<string, string>
}

const perId = <T extends { id: string }>(poster: T[]): Map<string, T> =>
  new Map(poster.map((post) => [post.id, post]))

const dublettfel = (typ: string, poster: { id: string; slug?: string }[]): string[] => {
  const fel: string[] = []
  const seddaId = new Set<string>()
  const seddaSluggar = new Set<string>()
  for (const post of poster) {
    if (seddaId.has(post.id)) fel.push(`${typ} ${post.id}: dubblett av id "${post.id}"`)
    seddaId.add(post.id)
    if (post.slug !== undefined) {
      if (seddaSluggar.has(post.slug)) fel.push(`${typ} ${post.id}: dubblett av slug "${post.slug}"`)
      seddaSluggar.add(post.slug)
    }
  }
  return fel
}

const publicerad = (status: string | undefined): boolean => status === 'publicerad'

// En refererad post: finns den, och (för publicerade rum) är den publicerad?
type Referens = { typ: string; id: string; finns: boolean; publicerad: boolean }

const rumsreferenser = (rum: Rum, uppslag: Uppslag): Referens[] => {
  const fråga = (typ: string, id: string): Referens => ({
    typ,
    id,
    finns: uppslag.frågor.has(id),
    publicerad: publicerad(uppslag.frågor.get(id)?.status),
  })
  return [
    fråga('primär fråga', rum.primärFråga),
    ...(rum.relateradeFrågor ?? []).map((id) => fråga('relaterad fråga', id)),
    ...rum.teman.map((id): Referens => ({
      typ: 'tema',
      id,
      finns: uppslag.teman.has(id),
      publicerad: publicerad(uppslag.teman.get(id)?.status),
    })),
    ...rum.källor.map((relation): Referens => ({
      typ: 'källa',
      id: relation.källa,
      finns: uppslag.källstatus.has(relation.källa),
      publicerad: publicerad(uppslag.källstatus.get(relation.källa)),
    })),
    ...rum.källor
      .filter((relation) => relation.passage !== undefined)
      .map((relation): Referens => ({
        typ: 'källpassage',
        id: relation.passage ?? '',
        finns: uppslag.passager.has(relation.passage ?? ''),
        publicerad: publicerad(uppslag.passager.get(relation.passage ?? '')?.status),
      })),
  ]
}

const relationsfel = (rum: Rum, uppslag: Uppslag): string[] =>
  rumsreferenser(rum, uppslag)
    .filter((referens) => !referens.finns)
    .map((referens) => `rum ${rum.id}: ${referens.typ} "${referens.id}" finns inte`)

// Citat och egen översättning kräver en källpassage med exakt referens och
// edition (source-and-context.md, Types of Source Use): så hålls källans ord
// belagda och åtskilda från redaktionell prosa. Bearbetning/parafras/inspiration
// får nöja sig med fritextreferens och passerar orörda.
const KRÄVER_PASSAGE: ReadonlySet<Kallrelation['bruk']> = new Set(['citat', 'översättning'])

const bruksgrind = (rum: Rum, relation: Kallrelation, uppslag: Uppslag): string[] => {
  if (!KRÄVER_PASSAGE.has(relation.bruk)) return []
  const märke = `rum ${rum.id}: ${relation.bruk}`
  if (relation.passage === undefined)
    return [`${märke} kräver en källpassage med exakt referens och edition`]
  const passage = uppslag.passager.get(relation.passage)
  if (!passage) return [] // saknad passage rapporteras redan som bruten relation
  return [
    ...(passage.utgåva ? [] : [`${märke} kräver edition (utgåva) på passagen "${passage.id}"`]),
    ...(relation.bruk === 'översättning' && !passage.översättare
      ? [`${märke} kräver angiven översättare på passagen "${passage.id}"`]
      : []),
  ]
}

// Publiceringskraven (source-and-context.md Publication Gate, room-schema.md).
const publiceringsfel = (rum: Rum, uppslag: Uppslag): string[] => {
  if (!publicerad(rum.status)) return []
  const grindar = [
    ...(rum.källor.some((relation) => relation.primär)
      ? []
      : [`rum ${rum.id}: publicerat rum saknar primär källa`]),
    ...(rum.lästidMinuter <= 10
      ? []
      : [`rum ${rum.id}: lästid ${rum.lästidMinuter} min utanför 1–10 för publicerat rum`]),
    ...rum.källor.flatMap((relation) => bruksgrind(rum, relation, uppslag)),
  ]
  const opublicerade = rumsreferenser(rum, uppslag)
    .filter((referens) => referens.finns && !referens.publicerad)
    .map((referens) => `rum ${rum.id}: länkar opublicerad(t) ${referens.typ} "${referens.id}"`)
  return [...grindar, ...opublicerade]
}

// Språkgrind (review-language.md): öppningen ska landa i vardagen, inte teasa
// eller introducera källan (det gör Kärnan). Gäller alla rum, även utkast, så en
// teaser aldrig ens kan committas — inte bara stoppas vid publicering.
const öppningsfel = (rum: Rum): string[] =>
  ärTeaseröppning(rum.öppning)
    ? [
        `rum ${rum.id}: öppningens sista stycke teasar/introducerar källan — låt öppningen landa i det vardagliga (eller en öppen fråga) och Kärnan introducera källan (review-language.md)`,
      ]
    : []

const temafel = (tema: Tema, uppslag: Uppslag): string[] => {
  if (tema.standardRum === undefined) return []
  const rum = uppslag.rum.get(tema.standardRum)
  if (!rum) return [`tema ${tema.id}: standardrum "${tema.standardRum}" finns inte`]
  const fel: string[] = []
  if (!rum.teman.includes(tema.id))
    fel.push(`tema ${tema.id}: standardrummet "${rum.id}" tillhör inte temat`)
  if (publicerad(tema.status) && !publicerad(rum.status))
    fel.push(`tema ${tema.id}: publicerat tema har opublicerat standardrum "${rum.id}"`)
  return fel
}

// Samma grindprincip som rummen: en publicerad fråga är en synlig ingång
// i biblioteket och får inte leda till opublicerat innehåll.
const fragereferens = (
  fråga: Fraga,
  typ: string,
  id: string,
  post: { status: string } | undefined,
): string[] => {
  if (!post) return [`fråga ${fråga.id}: ${typ} "${id}" finns inte`]
  if (publicerad(fråga.status) && !publicerad(post.status))
    return [`fråga ${fråga.id}: publicerad fråga länkar opublicerad(t) ${typ} "${id}"`]
  return []
}

const fragefel = (fråga: Fraga, uppslag: Uppslag): string[] => [
  ...fråga.teman.flatMap((id) => fragereferens(fråga, 'tema', id, uppslag.teman.get(id))),
  ...(fråga.relateradeFrågor ?? []).flatMap((id) =>
    fragereferens(fråga, 'relaterad fråga', id, uppslag.frågor.get(id)),
  ),
]

const vandringsfel = (mängd: Innehallsmangd, uppslag: Uppslag): string[] =>
  mängd.vandringar.flatMap((vandring) => {
    const fel: string[] = []
    // Central fråga: samma grind som rummen — en publicerad vandring är en
    // synlig ingång och får inte länka en opublicerad fråga.
    const central = uppslag.frågor.get(vandring.centralFråga)
    if (!central)
      fel.push(`vandring ${vandring.id}: central fråga "${vandring.centralFråga}" finns inte`)
    else if (publicerad(vandring.status) && !publicerad(central.status))
      fel.push(
        `vandring ${vandring.id}: publicerad vandring länkar opublicerad central fråga "${vandring.centralFråga}"`,
      )
    for (const rumId of vandring.rum) {
      const rum = uppslag.rum.get(rumId)
      if (!rum) fel.push(`vandring ${vandring.id}: rum "${rumId}" finns inte`)
      else if (publicerad(vandring.status) && !publicerad(rum.status))
        fel.push(`vandring ${vandring.id}: publicerad vandring innehåller opublicerat rum "${rumId}"`)
    }
    return fel
  })

// En publicerad källa måste ta ställning till upphov och datering (även svaret
// "okänt"/"omtvistat") så osäkerhet representeras i stället för att döljas
// (source-and-context.md, Uncertainty; Publication Gate).
const kallosakerhet = (källa: Kalla): string[] =>
  publicerad(källa.status)
    ? [
        ...(källa.upphov === undefined
          ? [`källa ${källa.id}: publicerad källa saknar upphovsstatus (upphov)`]
          : []),
        ...(källa.datering === undefined
          ? [`källa ${källa.id}: publicerad källa saknar dateringsstatus (datering)`]
          : []),
      ]
    : []

const kalltraditionsfel = (källa: Kalla, uppslag: Uppslag): string[] =>
  (källa.traditioner ?? []).flatMap((traditionId) => {
    if (!uppslag.traditionsstatus.has(traditionId))
      return [`källa ${källa.id}: tradition "${traditionId}" finns inte`]
    if (publicerad(källa.status) && !publicerad(uppslag.traditionsstatus.get(traditionId)))
      return [`källa ${källa.id}: publicerad källa länkar opublicerad tradition "${traditionId}"`]
    return []
  })

const kallfel = (mängd: Innehallsmangd, uppslag: Uppslag): string[] =>
  mängd.källor.flatMap((källa) => [
    ...kalltraditionsfel(källa, uppslag),
    ...kallosakerhet(källa),
  ])

const passagefel = (mängd: Innehallsmangd, uppslag: Uppslag): string[] =>
  mängd.passager.flatMap((passage) =>
    uppslag.källstatus.has(passage.källa)
      ? []
      : [`passage ${passage.id}: källa "${passage.källa}" finns inte`],
  )

/** Validerar relationer och publiceringskrav över hela innehållsmängden.
 * Tom lista = konsistent innehåll. */
export const valideraInnehall = (mängd: Innehallsmangd): string[] => {
  const uppslag: Uppslag = {
    rum: perId(mängd.rum),
    teman: perId(mängd.teman),
    frågor: perId(mängd.frågor),
    källstatus: new Map(mängd.källor.map((källa) => [källa.id, källa.status])),
    passager: perId(mängd.passager),
    traditionsstatus: new Map(
      mängd.traditioner.map((tradition) => [tradition.id, tradition.status]),
    ),
  }
  return [
    ...dublettfel('rum', mängd.rum),
    ...dublettfel('tema', mängd.teman),
    ...dublettfel('fråga', mängd.frågor),
    ...dublettfel('vandring', mängd.vandringar),
    ...dublettfel('källa', mängd.källor),
    ...dublettfel('passage', mängd.passager),
    ...dublettfel('tradition', mängd.traditioner),
    ...dublettfel('person', mängd.personer),
    ...mängd.rum.flatMap((rum) => relationsfel(rum, uppslag)),
    ...mängd.rum.flatMap((rum) => öppningsfel(rum)),
    ...mängd.rum.flatMap((rum) => publiceringsfel(rum, uppslag)),
    ...mängd.teman.flatMap((tema) => temafel(tema, uppslag)),
    ...mängd.frågor.flatMap((fråga) => fragefel(fråga, uppslag)),
    ...vandringsfel(mängd, uppslag),
    ...kallfel(mängd, uppslag),
    ...passagefel(mängd, uppslag),
  ]
}
