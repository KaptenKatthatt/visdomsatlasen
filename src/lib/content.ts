// Loads the editorial content (markdown with frontmatter) into the app.
// Vite's glob reads the files as raw text at build time; parsing and validation
// are shared with scripts/validera-innehall.ts, which has already stopped invalid
// content in the check chain — so errors here shouldn't occur, but are swallowed
// calmly and logged instead of taking the app down.
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
// The themes (and the threshold's selection) live in the lightweight troskeldata.ts
// so the home screen can reach them without pulling in the rooms' body text; they're
// re-exported here so the library's lookups (hittaTema and friends) and the search
// index can still go through innehall.
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

/** Source passages — canonical text excerpts with reference, edition and translation
 * (source-and-context.md, Suggested Passage Model). Rooms point here via the
 * relation's `passage`, so the source's words are kept apart from editorial prose. */
export const allPassages: SourcePassage[] = collect(
  toFiles(import.meta.glob<string>('../content/passages/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => parsePostFile(sourcePassageSchema, fil),
)

export const allTraditions: Tradition[] = collect(
  toFiles(import.meta.glob<string>('../content/traditions/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => parsePostFile(traditionSchema, fil),
)

/** People — reference points in the library, not entry points (library.md,
 * People and Authors). Portraits of the figures behind or around the sources. */
export const allPeople: Person[] = collect(
  toFiles(import.meta.glob<string>('../content/people/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => parsePostFile(personSchema, fil),
)

export const findRoom = (slug: string): Room | undefined =>
  allRooms.find((room) => room.slug === slug)

export const findRoomById = (id: string): Room | undefined =>
  allRooms.find((room) => room.id === id)

export const findTheme = (id: string): Theme | undefined =>
  allThemes.find((theme) => theme.id === id)

export const findThemeBySlug = (slug: string): Theme | undefined =>
  allThemes.find((theme) => theme.slug === slug)

export const findQuestion = (id: string): Question | undefined =>
  allQuestions.find((question) => question.id === id)

export const findQuestionBySlug = (slug: string): Question | undefined =>
  allQuestions.find((question) => question.slug === slug)

export const findSource = (id: string): Source | undefined =>
  allSources.find((source) => source.id === id)

export const findSourceBySlug = (slug: string): Source | undefined =>
  allSources.find((source) => source.slug === slug)

export const findTradition = (id: string): Tradition | undefined =>
  allTraditions.find((tradition) => tradition.id === id)

export const findPersonBySlug = (slug: string): Person | undefined =>
  allPeople.find((person) => person.slug === slug)

export const findPathBySlug = (slug: string): Path | undefined =>
  allPaths.find((path) => path.slug === slug)

export const findPathById = (id: string): Path | undefined =>
  allPaths.find((path) => path.id === id)

export const findPassage = (id: string): SourcePassage | undefined =>
  allPassages.find((passage) => passage.id === id)

/** Splits prose text into paragraphs on blank lines — the rooms' sections are plain prose. */
export const paragraphs = (text: string): string[] =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter((paragraph) => paragraph.length > 0)

/** The name in the colophon: the attributed voice before the recorder before the work. */
export const sourceName = (source: Source): string =>
  source.attributedAuthor ?? source.author ?? source.title

/** Honest uncertainty statements in plain text (source-and-context.md, Uncertainty):
 * hidden uncertainty weakens trust, not the source. Shared by the reading room and
 * the source page so the same wording meets the reader in both places. */
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

/** Short Swedish declaration of how the room uses the source (source-and-context.md). */
export const useLabel: Record<Room['sources'][number]['use'], string> = {
  'quote': 'Direkt citat.',
  'translation': 'Egen svensk översättning.',
  'paraphrase': 'Parafraserad återgivning.',
  'adaptation': 'Bearbetad för reflektion.',
  'inspiration': 'Redaktionell reflektion inspirerad av källan.',
  'compilation': 'Redaktionell sammanställning av flera källor.',
  'historical-context': 'Historisk bakgrundskälla.',
}
