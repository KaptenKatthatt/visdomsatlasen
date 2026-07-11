// Korsvalidering av hela innehållsmängden (roadmap fas 2, Content Validation):
// dubbletter, brutna relationer och publiceringskrav. Fältkraven per post tas
// av zod-schemana vid tolkningen; här kontrolleras det som kräver helheten.
// Publicerat innehåll får aldrig peka på opublicerat — utkast är fria.
import type { Fraga, Innehallsmangd, Rum, Tema } from './schema'

type Uppslag = {
  rum: Map<string, Rum>
  teman: Map<string, Tema>
  frågor: Map<string, Fraga>
  källstatus: Map<string, string>
  passagestatus: Map<string, string>
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
        finns: uppslag.passagestatus.has(relation.passage ?? ''),
        publicerad: publicerad(uppslag.passagestatus.get(relation.passage ?? '')),
      })),
  ]
}

const relationsfel = (rum: Rum, uppslag: Uppslag): string[] =>
  rumsreferenser(rum, uppslag)
    .filter((referens) => !referens.finns)
    .map((referens) => `rum ${rum.id}: ${referens.typ} "${referens.id}" finns inte`)

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
  ]
  const opublicerade = rumsreferenser(rum, uppslag)
    .filter((referens) => referens.finns && !referens.publicerad)
    .map((referens) => `rum ${rum.id}: länkar opublicerad(t) ${referens.typ} "${referens.id}"`)
  return [...grindar, ...opublicerade]
}

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

const fragefel = (fråga: Fraga, uppslag: Uppslag): string[] => {
  const fel: string[] = []
  for (const temaId of fråga.teman)
    if (!uppslag.teman.has(temaId)) fel.push(`fråga ${fråga.id}: tema "${temaId}" finns inte`)
  for (const relateradId of fråga.relateradeFrågor ?? [])
    if (!uppslag.frågor.has(relateradId))
      fel.push(`fråga ${fråga.id}: relaterad fråga "${relateradId}" finns inte`)
  return fel
}

const vandringsfel = (mängd: Innehallsmangd, uppslag: Uppslag): string[] =>
  mängd.vandringar.flatMap((vandring) => {
    const fel: string[] = []
    if (!uppslag.frågor.has(vandring.centralFråga))
      fel.push(`vandring ${vandring.id}: central fråga "${vandring.centralFråga}" finns inte`)
    for (const rumId of vandring.rum) {
      const rum = uppslag.rum.get(rumId)
      if (!rum) fel.push(`vandring ${vandring.id}: rum "${rumId}" finns inte`)
      else if (publicerad(vandring.status) && !publicerad(rum.status))
        fel.push(`vandring ${vandring.id}: publicerad vandring innehåller opublicerat rum "${rumId}"`)
    }
    return fel
  })

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
    passagestatus: new Map(mängd.passager.map((passage) => [passage.id, passage.status])),
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
    ...mängd.rum.flatMap((rum) => publiceringsfel(rum, uppslag)),
    ...mängd.teman.flatMap((tema) => temafel(tema, uppslag)),
    ...mängd.frågor.flatMap((fråga) => fragefel(fråga, uppslag)),
    ...vandringsfel(mängd, uppslag),
    ...passagefel(mängd, uppslag),
  ]
}
