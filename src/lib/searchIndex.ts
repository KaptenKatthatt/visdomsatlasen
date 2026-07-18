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
  Person,
  Room,
  Theme,
  Tradition,
  Path,
} from '../content/editorial/schema'
import {
  libraryQuestions,
  librarySources,
  libraryRooms,
  libraryThemes,
  libraryTraditions,
  libraryPeople,
  libraryPaths,
  passagesForSource,
  roomsForPath,
  pathReadingTime,
} from './library'
import {
  allQuestions,
  allSources,
  allPassages,
  allRooms,
  allThemes,
  allTraditions,
  allPeople,
  allPaths,
  sourceName,
} from './content'
import { utdrag } from './personal'
import { SEARCH_TYPES, type SearchType, type SearchParams } from './searchTypes'

// Söktyperna bor i soktyper.ts (utan innehållsberoenden) så routern kan
// validera URL:en utan att dra in indexbygget; här återexporteras de så
// befintliga importvägar (soklogik, sidor) fortsatt kan gå via sokindex.
export { SEARCH_TYPES, type SearchType, type SearchParams }

/** Sökmål = de To-varianter söket kan öppna (redaktionella sidor). Egen union,
 * strukturellt kompatibel med To, så sökindexet inte kopplas till legacy-eran i
 * model.ts. Traditioner saknar egen sida → olänkade rader, därav valfritt `mal`. */
export type SearchTarget =
  | { kind: 'fraga'; slug: string }
  | { kind: 'tema'; slug: string }
  | { kind: 'rum'; slug: string }
  | { kind: 'kallpost'; slug: string }
  | { kind: 'personpost'; slug: string }
  | { kind: 'vandring'; slug: string }

/** Ett sökdokument. `title`/`underrad`/`meta` visas oviket (korrekt stavning);
 * `alias`/`keywords`/`text` är sökbara fält med fallande vikt. `poang` finns
 * aldrig här — rankningen lever i soklogik.ts. */
export type SearchDoc = {
  type: SearchType
  id: string
  title: string
  subtitle?: string
  meta?: string
  target?: SearchTarget
  alias: string[]
  keywords: string[]
  text: string[]
}

const kartaById = <T extends { id: string }>(poster: T[]): Map<string, T> =>
  new Map(poster.map((post) => [post.id, post]))

const docFromQuestion = (fraga: Question): SearchDoc => ({
  type: 'fraga',
  id: fraga.id,
  title: fraga.text,
  subtitle: fraga.description ? utdrag(fraga.description, 110) : undefined,
  target: { kind: 'fraga', slug: fraga.slug },
  alias: [],
  keywords: fraga.keywords ?? [],
  text: fraga.description ? [fraga.description] : [],
})

const docFromTheme = (tema: Theme): SearchDoc => ({
  type: 'tema',
  id: tema.id,
  title: tema.label,
  subtitle: tema.description,
  target: { kind: 'tema', slug: tema.slug },
  alias: [],
  keywords: tema.keywords ?? [],
  text: tema.description ? [tema.description] : [],
})

const themeLabels = (rum: Room, themes: Map<string, Theme>): string[] =>
  rum.themes.flatMap((id) => {
    const tema = themes.get(id)
    return tema ? [tema.label] : []
  })

const sourceNameFor = (rum: Room, sources: Map<string, Source>): string[] =>
  rum.sources.flatMap((relation) => {
    const source = sources.get(relation.source)
    return source ? [sourceName(source)] : []
  })

const roomMeta = (rum: Room, fråga: Question | undefined): string => {
  const readingTime = `ca ${rum.readingTimeMinutes} min`
  return fråga ? `${fråga.text} · ${readingTime}` : readingTime
}

const docFromRoom = (
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
    subtitle: rum.summary,
    meta: roomMeta(rum, fråga),
    target: { kind: 'rum', slug: rum.slug },
    alias: [],
    keywords: rum.tags ?? [],
    text: [
      rum.thoughtToCarry,
      ...rum.reflectionQuestions,
      ...(fråga ? [fråga.text] : []),
      ...themeLabels(rum, themes),
      ...sourceNameFor(rum, sources),
    ],
  }
}

const pathMeta = (rummen: Room[]): string => {
  const antal = rummen.length === 1 ? 'Ett rum' : `${rummen.length} rum`
  return `${antal} · ca ${pathReadingTime(rummen)} min`
}

const docFromPath = (
  vandring: Path,
  frågor: Map<string, Question>,
  rummen: Room[],
): SearchDoc => {
  const central = frågor.get(vandring.centralQuestion)
  return {
    type: 'vandring',
    id: vandring.id,
    title: vandring.title,
    subtitle: utdrag(vandring.introduction, 110),
    meta: pathMeta(rummen),
    target: { kind: 'vandring', slug: vandring.slug },
    alias: [],
    keywords: vandring.keywords ?? [],
    text: [vandring.introduction, ...(central ? [central.text] : [])],
  }
}

const sourceAlias = (source: Source): string[] => [
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

const docFromSource = (
  source: Source,
  traditions: Map<string, Tradition>,
  passager: SourcePassage[],
): SearchDoc => ({
  type: 'kalla',
  id: source.id,
  title: source.title,
  subtitle: sourceName(source),
  meta: source.approximateDating,
  target: { kind: 'kallpost', slug: source.slug },
  alias: sourceAlias(source),
  keywords: source.keywords ?? [],
  text: [
    ...(source.description ? [source.description] : []),
    ...traditionsnamn(source, traditions),
    ...passagetext(passager),
  ],
})

const docFromTradition = (tradition: Tradition): SearchDoc => ({
  type: 'tradition',
  id: tradition.id,
  title: tradition.name,
  subtitle: tradition.description,
  target: undefined,
  alias: [],
  keywords: tradition.keywords ?? [],
  text: tradition.description ? [tradition.description] : [],
})

// Personresultatet visar name, period och kort igenkännande description
// (search.md, Person Result); personer rankas alltid sist (Result Priority).
// Underraden tar den redaktionella kortbeskrivningen — porträttkroppens
// första mening är födelsedata och dubblerar årtalet i meta.
const docFromPerson = (person: Person): SearchDoc => ({
  type: 'person',
  id: person.id,
  title: person.name,
  subtitle: person.shortDescription ?? (person.description ? utdrag(person.description, 110) : undefined),
  meta: person.years,
  target: { kind: 'personpost', slug: person.slug },
  alias: [],
  keywords: [],
  text: [
    ...(person.shortDescription ? [person.shortDescription] : []),
    ...(person.description ? [person.description] : []),
  ],
})

type Innehall = Pick<
  ContentSet,
  'rooms' | 'themes' | 'questions' | 'paths' | 'sources' | 'passages' | 'traditions' | 'people'
>

/** Bygger det publika indexet. Uppslagskartorna byggs ur de PUBLICERADE
 * urvalen, så ingen utkasttext kan följa med in i ett sökbart fält ens via en
 * reference. */
export const byggSokindex = (innehall: Innehall): SearchDoc[] => {
  const frågor = kartaById(libraryQuestions(innehall.questions))
  const themes = kartaById(libraryThemes(innehall.themes))
  const sources = kartaById(librarySources(innehall.sources))
  const traditions = kartaById(libraryTraditions(innehall.traditions))
  return [
    ...libraryQuestions(innehall.questions).map(docFromQuestion),
    ...libraryThemes(innehall.themes).map(docFromTheme),
    ...libraryRooms(innehall.rooms).map((rum) => docFromRoom(rum, frågor, themes, sources)),
    ...libraryPaths(innehall.paths).map((vandring) =>
      docFromPath(vandring, frågor, roomsForPath(vandring, innehall.rooms)),
    ),
    ...librarySources(innehall.sources).map((source) =>
      docFromSource(source, traditions, passagesForSource(source.id, innehall.passages)),
    ),
    ...libraryTraditions(innehall.traditions).map(docFromTradition),
    ...libraryPeople(innehall.people).map(docFromPerson),
  ]
}

/** Appens index, byggt en gång vid moduladdning ur allt laddat innehåll. */
export const searchIndexData: SearchDoc[] = byggSokindex({
  rooms: allRooms,
  themes: allThemes,
  questions: allQuestions,
  paths: allPaths,
  sources: allSources,
  passages: allPassages,
  traditions: allTraditions,
  people: allPeople,
})
