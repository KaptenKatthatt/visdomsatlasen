// Det publika sökindexet (search.md, Indexing): ett genererat dokument per
// publicerad post. Byggs UTESLUTANDE via bibliotek.ts-urvalen och slår bara upp
// referenser bland publicerade poster, så utkast och intern metadata aldrig kan
// nå ett sökbart fält. Privata anteckningar hör inte hemma här — de har en helt
// egen väg (sokanteckningar.ts).
import type {
  Fraga,
  Innehallsmangd,
  Kalla,
  Kallpassage,
  Rum,
  Tema,
  Tradition,
  Vandring,
} from '../content/editorial/schema'
import {
  bibliotekFragor,
  bibliotekKallor,
  bibliotekRum,
  bibliotekTeman,
  bibliotekTraditioner,
  bibliotekVandringar,
  passagerForKalla,
  rumForVandring,
  vandringLastid,
} from './bibliotek'
import {
  allaFragor,
  allaKallor,
  allaPassager,
  allaRum,
  allaTeman,
  allaTraditioner,
  allaVandringar,
  kallnamn,
} from './innehall'
import { utdrag } from './personligt'
import { SOKTYPER, type Soktyp, type SökParametrar } from './soktyper'

// Söktyperna bor i soktyper.ts (utan innehållsberoenden) så routern kan
// validera URL:en utan att dra in indexbygget; här återexporteras de så
// befintliga importvägar (soklogik, sidor) fortsatt kan gå via sokindex.
export { SOKTYPER, type Soktyp, type SökParametrar }

/** Sökmål = de To-varianter söket kan öppna (redaktionella sidor). Egen union,
 * strukturellt kompatibel med To, så sökindexet inte kopplas till legacy-eran i
 * model.ts. Traditioner saknar egen sida → olänkade rader, därav valfritt `mal`. */
export type Sokmal =
  | { kind: 'fraga'; slug: string }
  | { kind: 'tema'; slug: string }
  | { kind: 'rum'; slug: string }
  | { kind: 'kallpost'; slug: string }
  | { kind: 'vandring'; slug: string }

/** Ett sökdokument. `title`/`underrad`/`meta` visas oviket (korrekt stavning);
 * `alias`/`keywords`/`text` är sökbara fält med fallande vikt. `poang` finns
 * aldrig här — rankningen lever i soklogik.ts. */
export type Sokdokument = {
  type: Soktyp
  id: string
  title: string
  underrad?: string
  meta?: string
  mal?: Sokmal
  alias: string[]
  keywords: string[]
  text: string[]
}

const kartaViaId = <T extends { id: string }>(poster: T[]): Map<string, T> =>
  new Map(poster.map((post) => [post.id, post]))

const dokumentUrFraga = (fraga: Fraga): Sokdokument => ({
  type: 'fraga',
  id: fraga.id,
  title: fraga.text,
  underrad: fraga.description ? utdrag(fraga.description, 110) : undefined,
  mal: { kind: 'fraga', slug: fraga.slug },
  alias: [],
  keywords: fraga.keywords ?? [],
  text: fraga.description ? [fraga.description] : [],
})

const dokumentUrTema = (tema: Tema): Sokdokument => ({
  type: 'tema',
  id: tema.id,
  title: tema.label,
  underrad: tema.description,
  mal: { kind: 'tema', slug: tema.slug },
  alias: [],
  keywords: tema.keywords ?? [],
  text: tema.description ? [tema.description] : [],
})

const temaEtiketter = (rum: Rum, themes: Map<string, Tema>): string[] =>
  rum.themes.flatMap((id) => {
    const tema = themes.get(id)
    return tema ? [tema.label] : []
  })

const kallnamnFor = (rum: Rum, sources: Map<string, Kalla>): string[] =>
  rum.sources.flatMap((relation) => {
    const source = sources.get(relation.source)
    return source ? [kallnamn(source)] : []
  })

const rumMeta = (rum: Rum, fråga: Fraga | undefined): string => {
  const lästid = `ca ${rum.readingTimeMinutes} min`
  return fråga ? `${fråga.text} · ${lästid}` : lästid
}

const dokumentUrRum = (
  rum: Rum,
  frågor: Map<string, Fraga>,
  themes: Map<string, Tema>,
  sources: Map<string, Kalla>,
): Sokdokument => {
  const fråga = frågor.get(rum.primaryQuestion)
  return {
    type: 'rum',
    id: rum.id,
    title: rum.title,
    underrad: rum.summary,
    meta: rumMeta(rum, fråga),
    mal: { kind: 'rum', slug: rum.slug },
    alias: [],
    keywords: rum.tags ?? [],
    text: [
      rum.thoughtToCarry,
      ...rum.reflectionQuestions,
      ...(fråga ? [fråga.text] : []),
      ...temaEtiketter(rum, themes),
      ...kallnamnFor(rum, sources),
    ],
  }
}

const vandringMeta = (rummen: Rum[]): string => {
  const antal = rummen.length === 1 ? 'Ett rum' : `${rummen.length} rum`
  return `${antal} · ca ${vandringLastid(rummen)} min`
}

const dokumentUrVandring = (
  vandring: Vandring,
  frågor: Map<string, Fraga>,
  rummen: Rum[],
): Sokdokument => {
  const central = frågor.get(vandring.centralQuestion)
  return {
    type: 'vandring',
    id: vandring.id,
    title: vandring.title,
    underrad: utdrag(vandring.introduction, 110),
    meta: vandringMeta(rummen),
    mal: { kind: 'vandring', slug: vandring.slug },
    alias: [],
    keywords: vandring.keywords ?? [],
    text: [vandring.introduction, ...(central ? [central.text] : [])],
  }
}

const kallaAlias = (source: Kalla): string[] => [
  ...(source.originalTitle ? [source.originalTitle] : []),
  ...(source.alias ?? []),
  ...(source.author ? [source.author] : []),
  ...(source.attributedAuthor ? [source.attributedAuthor] : []),
]

const traditionsnamn = (source: Kalla, traditions: Map<string, Tradition>): string[] =>
  (source.traditions ?? []).flatMap((id) => {
    const tradition = traditions.get(id)
    return tradition ? [tradition.name] : []
  })

const passagetext = (passager: Kallpassage[]): string[] =>
  passager.flatMap((passage) => [
    passage.reference,
    ...(passage.translation ? [passage.translation] : []),
  ])

const dokumentUrKalla = (
  source: Kalla,
  traditions: Map<string, Tradition>,
  passager: Kallpassage[],
): Sokdokument => ({
  type: 'kalla',
  id: source.id,
  title: source.title,
  underrad: kallnamn(source),
  meta: source.approximateDating,
  mal: { kind: 'kallpost', slug: source.slug },
  alias: kallaAlias(source),
  keywords: source.keywords ?? [],
  text: [
    ...(source.description ? [source.description] : []),
    ...traditionsnamn(source, traditions),
    ...passagetext(passager),
  ],
})

const dokumentUrTradition = (tradition: Tradition): Sokdokument => ({
  type: 'tradition',
  id: tradition.id,
  title: tradition.name,
  underrad: tradition.description,
  mal: undefined,
  alias: [],
  keywords: tradition.keywords ?? [],
  text: tradition.description ? [tradition.description] : [],
})

type Innehall = Pick<
  Innehallsmangd,
  'rum' | 'themes' | 'frågor' | 'vandringar' | 'sources' | 'passager' | 'traditions'
>

/** Bygger det publika indexet. Uppslagskartorna byggs ur de PUBLICERADE
 * urvalen, så ingen utkasttext kan följa med in i ett sökbart fält ens via en
 * reference. */
export const byggSokindex = (innehall: Innehall): Sokdokument[] => {
  const frågor = kartaViaId(bibliotekFragor(innehall.frågor))
  const themes = kartaViaId(bibliotekTeman(innehall.themes))
  const sources = kartaViaId(bibliotekKallor(innehall.sources))
  const traditions = kartaViaId(bibliotekTraditioner(innehall.traditions))
  return [
    ...bibliotekFragor(innehall.frågor).map(dokumentUrFraga),
    ...bibliotekTeman(innehall.themes).map(dokumentUrTema),
    ...bibliotekRum(innehall.rum).map((rum) => dokumentUrRum(rum, frågor, themes, sources)),
    ...bibliotekVandringar(innehall.vandringar).map((vandring) =>
      dokumentUrVandring(vandring, frågor, rumForVandring(vandring, innehall.rum)),
    ),
    ...bibliotekKallor(innehall.sources).map((source) =>
      dokumentUrKalla(source, traditions, passagerForKalla(source.id, innehall.passager)),
    ),
    ...bibliotekTraditioner(innehall.traditions).map(dokumentUrTradition),
  ]
}

/** Appens index, byggt en gång vid moduladdning ur allt laddat innehåll. */
export const sokindexet: Sokdokument[] = byggSokindex({
  rum: allaRum,
  themes: allaTeman,
  frågor: allaFragor,
  vandringar: allaVandringar,
  sources: allaKallor,
  passager: allaPassager,
  traditions: allaTraditioner,
})
