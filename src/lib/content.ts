// Laddar det redaktionella innehållet (markdown med frontmatter) in i appen.
// Vites glob läser filerna som råtext vid bygget; tolkningen och valideringen
// delas med scripts/validera-innehall.ts, som redan stoppat ogiltigt innehåll
// i check-kedjan — fel här ska därför inte inträffa, men sväljs lugnt och
// loggas i stället för att fälla appen.
import {
  questionSchema,
  sourceSchema,
  sourcePassageSchema,
  personSchema,
  traditionSchema,
  pathSchema,
  type Question,
  type Source,
  type SourcePassage,
  type Person,
  type Room,
  type Theme,
  type Tradition,
  type Path,
} from '../content/editorial/schema'
import { collect, toFiles } from '../content/editorial/collect'
import { parsePostFile, parseRoomFile } from '../content/editorial/parse'
// Temana (och tröskelns urval) bor i det lätta troskeldata.ts så hemskärmen kan
// nå dem utan att dra in rummens brödtext; här återexporteras de så bibliotekets
// uppslag (hittaTema m.fl.) och sökindexet fortsatt kan gå via innehall.
import { allThemes, thresholdThemes } from './homeData'

export { allThemes, thresholdThemes }

export const allRooms: Room[] = collect(
  toFiles(import.meta.glob<string>('../content/rooms/*.md', { query: '?raw', import: 'default', eager: true })),
  parseRoomFile,
)

export const allQuestions: Question[] = collect(
  toFiles(import.meta.glob<string>('../content/questions/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => parsePostFile(questionSchema, fil),
)

export const allSources: Source[] = collect(
  toFiles(import.meta.glob<string>('../content/sources/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => parsePostFile(sourceSchema, fil),
)

export const allPaths: Path[] = collect(
  toFiles(import.meta.glob<string>('../content/paths/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => parsePostFile(pathSchema, fil),
)

/** Källpassager — kanoniska textutdrag med reference, edition och translation
 * (source-and-context.md, Suggested Passage Model). Rum pekar hit via
 * relationens `passage`, så källans ord hålls åtskilda från redaktionell prosa. */
export const allPassages: SourcePassage[] = collect(
  toFiles(import.meta.glob<string>('../content/passages/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => parsePostFile(sourcePassageSchema, fil),
)

export const allTraditions: Tradition[] = collect(
  toFiles(import.meta.glob<string>('../content/traditions/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => parsePostFile(traditionSchema, fil),
)

/** Personer — referenspunkter i biblioteket, inte ingångar (library.md,
 * People and Authors). Porträtt av gestalterna bakom eller kring källorna. */
export const allPeople: Person[] = collect(
  toFiles(import.meta.glob<string>('../content/people/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => parsePostFile(personSchema, fil),
)

export const findRoom = (slug: string): Room | undefined =>
  allRooms.find((rum) => rum.slug === slug)

export const findRoomById = (id: string): Room | undefined =>
  allRooms.find((rum) => rum.id === id)

export const findTheme = (id: string): Theme | undefined =>
  allThemes.find((tema) => tema.id === id)

export const findThemeBySlug = (slug: string): Theme | undefined =>
  allThemes.find((tema) => tema.slug === slug)

export const findQuestion = (id: string): Question | undefined =>
  allQuestions.find((fråga) => fråga.id === id)

export const findQuestionBySlug = (slug: string): Question | undefined =>
  allQuestions.find((fråga) => fråga.slug === slug)

export const findSource = (id: string): Source | undefined =>
  allSources.find((source) => source.id === id)

export const findSourceBySlug = (slug: string): Source | undefined =>
  allSources.find((source) => source.slug === slug)

export const findTradition = (id: string): Tradition | undefined =>
  allTraditions.find((tradition) => tradition.id === id)

export const findPersonBySlug = (slug: string): Person | undefined =>
  allPeople.find((person) => person.slug === slug)

export const findPathBySlug = (slug: string): Path | undefined =>
  allPaths.find((vandring) => vandring.slug === slug)

export const findPathById = (id: string): Path | undefined =>
  allPaths.find((vandring) => vandring.id === id)

export const findPassage = (id: string): SourcePassage | undefined =>
  allPassages.find((passage) => passage.id === id)

/** Delar prosatext i stycken på tomrad — rummens sektioner är ren prosa. */
export const paragraphs = (text: string): string[] =>
  text
    .split(/\n\s*\n/)
    .map((stycke) => stycke.replace(/\s*\n\s*/g, ' ').trim())
    .filter((stycke) => stycke.length > 0)

/** Namnet i kolofonen: den tillskrivna rösten före nedtecknaren före verket. */
export const sourceName = (source: Source): string =>
  source.attributedAuthor ?? source.author ?? source.title

/** Ärliga osäkerhetsmeningar i klartext (source-and-context.md, Uncertainty):
 * dold osäkerhet försvagar tilliten, inte källan. Delas av läsrummet och
 * källsidan så samma formulering möter läsaren på båda ställena. */
export const uncertainties = (source: Source): string[] => {
  const name = source.attributedAuthor ?? source.author ?? 'annan hand'
  const rows: string[] = []
  if (source.attribution === 'attributed')
    rows.push(`Verket tillskrivs traditionellt ${name}; författarskapet är inte säkert belagt.`)
  if (source.attribution === 'disputed') rows.push('Författarskapet är omdiskuterat.')
  if (source.attribution === 'unknown') rows.push('Upphovspersonen är okänd.')
  if (source.dating === 'approximate') rows.push('Textens exakta datering är osäker.')
  if (source.dating === 'disputed') rows.push('Textens datering är omtvistad.')
  if (source.dating === 'unknown') rows.push('När texten tillkom är okänt.')
  return rows
}

/** Kort svensk deklaration av hur rummet använder källan (source-and-context.md). */
export const useLabel: Record<Room['sources'][number]['use'], string> = {
  'quote': 'Direkt citat.',
  'translation': 'Egen svensk översättning.',
  'paraphrase': 'Parafraserad återgivning.',
  'adaptation': 'Bearbetad för reflektion.',
  'inspiration': 'Redaktionell reflektion inspirerad av källan.',
  'compilation': 'Redaktionell sammanställning av flera källor.',
  'historical-context': 'Historisk bakgrundskälla.',
}
