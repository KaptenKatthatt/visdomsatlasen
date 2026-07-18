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

const mapById = <T extends { id: string }>(items: T[]): Map<string, T> =>
  new Map(items.map((post) => [post.id, post]))

const docFromQuestion = (question: Question): SearchDoc => ({
  type: 'fraga',
  id: question.id,
  title: question.text,
  subtitle: question.description ? utdrag(question.description, 110) : undefined,
  target: { kind: 'fraga', slug: question.slug },
  alias: [],
  keywords: question.keywords ?? [],
  text: question.description ? [question.description] : [],
})

const docFromTheme = (theme: Theme): SearchDoc => ({
  type: 'tema',
  id: theme.id,
  title: theme.label,
  subtitle: theme.description,
  target: { kind: 'tema', slug: theme.slug },
  alias: [],
  keywords: theme.keywords ?? [],
  text: theme.description ? [theme.description] : [],
})

const themeLabels = (room: Room, themes: Map<string, Theme>): string[] =>
  room.themes.flatMap((id) => {
    const theme = themes.get(id)
    return theme ? [theme.label] : []
  })

const sourceNameFor = (room: Room, sources: Map<string, Source>): string[] =>
  room.sources.flatMap((relation) => {
    const source = sources.get(relation.source)
    return source ? [sourceName(source)] : []
  })

const roomMeta = (room: Room, question: Question | undefined): string => {
  const readingTime = `ca ${room.readingTimeMinutes} min`
  return question ? `${question.text} · ${readingTime}` : readingTime
}

const docFromRoom = (
  room: Room,
  questions: Map<string, Question>,
  themes: Map<string, Theme>,
  sources: Map<string, Source>,
): SearchDoc => {
  const question = questions.get(room.primaryQuestion)
  return {
    type: 'rum',
    id: room.id,
    title: room.title,
    subtitle: room.summary,
    meta: roomMeta(room, question),
    target: { kind: 'rum', slug: room.slug },
    alias: [],
    keywords: room.tags ?? [],
    text: [
      room.thoughtToCarry,
      ...room.reflectionQuestions,
      ...(question ? [question.text] : []),
      ...themeLabels(room, themes),
      ...sourceNameFor(room, sources),
    ],
  }
}

const pathMeta = (rooms: Room[]): string => {
  const antal = rooms.length === 1 ? 'Ett rum' : `${rooms.length} rum`
  return `${antal} · ca ${pathReadingTime(rooms)} min`
}

const docFromPath = (
  path: Path,
  questions: Map<string, Question>,
  rooms: Room[],
): SearchDoc => {
  const central = questions.get(path.centralQuestion)
  return {
    type: 'vandring',
    id: path.id,
    title: path.title,
    subtitle: utdrag(path.introduction, 110),
    meta: pathMeta(rooms),
    target: { kind: 'vandring', slug: path.slug },
    alias: [],
    keywords: path.keywords ?? [],
    text: [path.introduction, ...(central ? [central.text] : [])],
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

type IndexContent = Pick<
  ContentSet,
  'rooms' | 'themes' | 'questions' | 'paths' | 'sources' | 'passages' | 'traditions' | 'people'
>

/** Bygger det publika indexet. Uppslagskartorna byggs ur de PUBLICERADE
 * urvalen, så ingen utkasttext kan följa med in i ett sökbart fält ens via en
 * reference. */
export const buildSearchIndex = (innehall: IndexContent): SearchDoc[] => {
  const questions = mapById(libraryQuestions(innehall.questions))
  const themes = mapById(libraryThemes(innehall.themes))
  const sources = mapById(librarySources(innehall.sources))
  const traditions = mapById(libraryTraditions(innehall.traditions))
  return [
    ...libraryQuestions(innehall.questions).map(docFromQuestion),
    ...libraryThemes(innehall.themes).map(docFromTheme),
    ...libraryRooms(innehall.rooms).map((room) => docFromRoom(room, questions, themes, sources)),
    ...libraryPaths(innehall.paths).map((path) =>
      docFromPath(path, questions, roomsForPath(path, innehall.rooms)),
    ),
    ...librarySources(innehall.sources).map((source) =>
      docFromSource(source, traditions, passagesForSource(source.id, innehall.passages)),
    ),
    ...libraryTraditions(innehall.traditions).map(docFromTradition),
    ...libraryPeople(innehall.people).map(docFromPerson),
  ]
}

/** Appens index, byggt en gång vid moduladdning ur allt laddat innehåll. */
export const searchIndexData: SearchDoc[] = buildSearchIndex({
  rooms: allRooms,
  themes: allThemes,
  questions: allQuestions,
  paths: allPaths,
  sources: allSources,
  passages: allPassages,
  traditions: allTraditions,
  people: allPeople,
})
