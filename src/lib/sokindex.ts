// Det publika sökindexet (search.md, Indexing): ett genererat dokument per
// publicerad post. Byggs UTESLUTANDE via bibliotek.ts-urvalen och slår bara upp
// referenser bland publicerade poster, så utkast och intern metadata aldrig kan
// nå ett sökbart fält. Privata anteckningar hör inte hemma här — de har en helt
// egen väg (sokanteckningar.ts).
import type {
  Question,
  ContentSet,
  Source,
  SourcePassage,
  Room,
  Theme,
  Tradition,
  Path,
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
import { SOKTYPER, type SearchType, type SearchParams } from './soktyper'

// Söktyperna bor i soktyper.ts (utan innehållsberoenden) så routern kan
// validera URL:en utan att dra in indexbygget; här återexporteras de så
// befintliga importvägar (soklogik, sidor) fortsatt kan gå via sokindex.
export { SOKTYPER, type SearchType, type SearchParams }

/** Sökmål = de To-varianter söket kan öppna (redaktionella sidor). Egen union,
 * strukturellt kompatibel med To, så sökindexet inte kopplas till legacy-eran i
 * model.ts. Traditioner saknar egen sida → olänkade rader, därav valfritt `mal`. */
export type SearchTarget =
  | { kind: 'fraga'; slug: string }
  | { kind: 'tema'; slug: string }
  | { kind: 'rum'; slug: string }
  | { kind: 'kallpost'; slug: string }
  | { kind: 'vandring'; slug: string }

/** Ett sökdokument. `title`/`underrad`/`meta` visas oviket (korrekt stavning);
 * `alias`/`keywords`/`text` är sökbara fält med fallande vikt. `poang` finns
 * aldrig här — rankningen lever i soklogik.ts. */
export type SearchDoc = {
  type: SearchType
  id: string
  title: string
  underrad?: string
  meta?: string
  mal?: SearchTarget
  alias: string[]
  keywords: string[]
  text: string[]
}

const kartaViaId = <T extends { id: string }>(poster: T[]): Map<string, T> =>
  new Map(poster.map((post) => [post.id, post]))

const dokumentUrFraga = (fraga: Question): SearchDoc => ({
  type: 'fraga',
  id: fraga.id,
  title: fraga.text,
  underrad: fraga.description ? utdrag(fraga.description, 110) : undefined,
  mal: { kind: 'fraga', slug: fraga.slug },
  alias: [],
  keywords: fraga.keywords ?? [],
  text: fraga.description ? [fraga.description] : [],
})

const dokumentUrTema = (tema: Theme): SearchDoc => ({
  type: 'tema',
  id: tema.id,
  title: tema.label,
  underrad: tema.description,
  mal: { kind: 'tema', slug: tema.slug },
  alias: [],
  keywords: tema.keywords ?? [],
  text: tema.description ? [tema.description] : [],
})

const temaEtiketter = (rum: Room, themes: Map<string, Theme>): string[] =>
  rum.themes.flatMap((id) => {
    const tema = themes.get(id)
    return tema ? [tema.label] : []
  })

const kallnamnFor = (rum: Room, sources: Map<string, Source>): string[] =>
  rum.sources.flatMap((relation) => {
    const source = sources.get(relation.source)
    return source ? [kallnamn(source)] : []
  })

const rumMeta = (rum: Room, fråga: Question | undefined): string => {
  const lästid = `ca ${rum.readingTimeMinutes} min`
  return fråga ? `${fråga.text} · ${lästid}` : lästid
}

const dokumentUrRum = (
  rum: Room,
  frågor: Map<string, Question>,
  themes: Map<string, Theme>,
  sources: Map<string, Source>,
): SearchDoc => {
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

const vandringMeta = (rummen: Room[]): string => {
  const antal = rummen.length === 1 ? 'Ett rum' : `${rummen.length} rum`
  return `${antal} · ca ${vandringLastid(rummen)} min`
}

const dokumentUrVandring = (
  vandring: Path,
  frågor: Map<string, Question>,
  rummen: Room[],
): SearchDoc => {
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

const kallaAlias = (source: Source): string[] => [
  ...(source.originalTitle ? [source.originalTitle] : []),
  ...(source.alias ?? []),
  ...(source.author ? [source.author] : []),
  ...(source.attributedAuthor ? [source.attributedAuthor] : []),
]

const traditionsnamn = (source: Source, traditions: Map<string, Tradition>): string[] =>
  (source.traditions ?? []).flatMap((id) => {
    const tradition = traditions.get(id)
    return tradition ? [tradition.name] : []
  })

const passagetext = (passager: SourcePassage[]): string[] =>
  passager.flatMap((passage) => [
    passage.reference,
    ...(passage.translation ? [passage.translation] : []),
  ])

const dokumentUrKalla = (
  source: Source,
  traditions: Map<string, Tradition>,
  passager: SourcePassage[],
): SearchDoc => ({
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

const dokumentUrTradition = (tradition: Tradition): SearchDoc => ({
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
  ContentSet,
  'rum' | 'themes' | 'frågor' | 'vandringar' | 'sources' | 'passager' | 'traditions'
>

/** Bygger det publika indexet. Uppslagskartorna byggs ur de PUBLICERADE
 * urvalen, så ingen utkasttext kan följa med in i ett sökbart fält ens via en
 * reference. */
export const byggSokindex = (innehall: Innehall): SearchDoc[] => {
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
export const sokindexet: SearchDoc[] = byggSokindex({
  rum: allaRum,
  themes: allaTeman,
  frågor: allaFragor,
  vandringar: allaVandringar,
  sources: allaKallor,
  passager: allaPassager,
  traditions: allaTraditioner,
})
