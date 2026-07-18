// Redaktionella innehållsmodeller (roadmap fas 2). Strukturen följer specarna
// (room-schema.md, source-and-context.md, paths.md, room-selection.md) men
// fältnamn och värden är svenska — frontmattern är redaktörens language.
// Innehållet bor i Markdown med frontmatter under src/content/<type>/.
import { z } from 'zod'

/** Publiceringsstatus — endast `publicerad` får synas för läsare. */
const statusSchema = z.enum(['draft', 'review', 'published', 'archived'])

// Sluggar är ascii-kebab (svenska ord skrivs utan åäö: "det-du-inte-kan-styra")
// eftersom de används i URL:er.
const slugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ogiltig slug (ascii-kebab)')
const idSchema = z.string().min(1)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'datum som ÅÅÅÅ-MM-DD')

// Redaktionella sök-keywords (search.md, Editorial Keywords): synonymer, vanligt
// användarspråk och alternativa stavningar som bara förbättrar upptäckt i söket.
// Aldrig synliga i det vanliga gränssnittet; söket viker dem för matchning.
const keywordsSchema = z.array(z.string().min(1)).optional()

/** Hur ett rum använder en source (source-and-context.md, Types of Source Use). */
const useSchema = z.enum([
  'quote',
  'translation',
  'paraphrase',
  'adaptation',
  'inspiration',
  'compilation',
  'historical-context',
])

/** Relation rum → source; deklareras i rummets frontmatter under `sources:`. */
const sourceRelationSchema = z.object({
  source: idSchema,
  passage: idSchema.optional(),
  // Fritextreferens tills källpassager finns som egna poster, t.ex. "avsnitt 1".
  reference: z.string().min(1).optional(),
  use: useSchema,
  primary: z.boolean().default(false),
  editorialNote: z.string().optional(),
})

/** Redaktionellt ansvar (source-and-context.md, Editorial Responsibility). */
const editorialSchema = z.object({
  writer: z.string().optional(),
  sourceReviewer: z.string().optional(),
  languageReviewer: z.string().optional(),
  reviewed: dateSchema.optional(),
  notes: z.string().optional(),
  version: z.number().int().min(1).default(1),
})

/** Ett reflektionsrum. `opening`/`core`/`historicalContext` fylls från
 * markdown-kroppens ##-sektioner av tolken, inte från frontmatter. */
export const roomSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  primaryQuestion: idSchema,
  themes: z.array(idSchema).min(1),
  thoughtToCarry: z.string().min(1),
  reflectionQuestions: z.array(z.string().min(1)).min(1).max(5),
  sources: z.array(sourceRelationSchema).min(1),
  readingTimeMinutes: z.number().int().min(1),
  language: z.string().default('sv'),
  status: statusSchema,
  created: dateSchema,
  updated: dateSchema,
  editorial: editorialSchema.optional(),
  tags: z.array(z.string().min(1)).optional(),
  relatedQuestions: z.array(idSchema).optional(),
  opening: z.string().min(1),
  core: z.string().min(1),
  historicalContext: z.string().optional(),
})
export type Room = z.infer<typeof roomSchema>

/** Tema — bred mänsklig ingång på tröskeln (home-and-entry.md). Rummen äger
 * relationen via `themes`; temat pekar bara ut sitt redaktionella standardrum. */
export const themeSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  label: z.string().min(1),
  defaultRoom: idSchema.optional(),
  // Redaktionell order på tröskeln (home-and-entry.md); lägst först.
  order: z.number().int().min(1).optional(),
  status: statusSchema,
  description: z.string().optional(),
  keywords: keywordsSchema,
})
export type Theme = z.infer<typeof themeSchema>

/** Mänsklig fråga — taxonomins hjärta (question-taxonomy.md). */
export const questionSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  text: z.string().min(1),
  themes: z.array(idSchema).min(1),
  relatedQuestions: z.array(idSchema).optional(),
  status: statusSchema,
  description: z.string().optional(),
  keywords: keywordsSchema,
})
export type Question = z.infer<typeof questionSchema>

/** Vandring — kuraterad följd av rum (paths.md, Data Requirements). */
export const pathSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1),
  introduction: z.string().min(1),
  centralQuestion: idSchema,
  rooms: z.array(idSchema).min(3).max(7),
  closingReflection: z.string().optional(),
  status: statusSchema,
  created: dateSchema,
  updated: dateSchema,
  editorialNotes: z.string().optional(),
  keywords: keywordsSchema,
})
export type Path = z.infer<typeof pathSchema>

/** Kanonisk källpost (source-and-context.md, Suggested Source Model). */
export const sourceSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1),
  originalTitle: z.string().optional(),
  type: z.enum([
    'book',
    'writing',
    'letter',
    'speech',
    'poem',
    'inscription',
    'oral-tradition',
    'historical-document',
    'fragment',
    'other',
  ]),
  author: z.string().optional(),
  attributedAuthor: z.string().optional(),
  traditions: z.array(idSchema).optional(),
  originalLanguage: z.string().optional(),
  approximateDating: z.string().optional(),
  place: z.string().optional(),
  attribution: z.enum(['known', 'attributed', 'disputed', 'unknown']).optional(),
  dating: z.enum(['known', 'approximate', 'disputed', 'unknown']).optional(),
  rights: z.enum(['public-domain', 'licensed', 'protected', 'unknown']),
  // Verk i biblioteksdatabasen kopplas hit, så rum kan nå exakta verser.
  libraryWork: z.string().optional(),
  status: statusSchema,
  description: z.string().optional(),
  // Alternativa name för källan (search.md): originalspråkiga eller översatta
  // titlar och etablerade förkortningar, t.ex. "Epictetus", "Handboken".
  alias: z.array(z.string().min(1)).optional(),
  keywords: keywordsSchema,
})
export type Source = z.infer<typeof sourceSchema>

/** Källpassage (source-and-context.md, Suggested Passage Model). */
export const sourcePassageSchema = z.object({
  id: idSchema,
  source: idSchema,
  reference: z.string().min(1),
  originalText: z.string().optional(),
  translation: z.string().optional(),
  translator: z.string().optional(),
  edition: z.string().optional(),
  publicationYear: z.number().int().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  status: statusSchema,
})
export type SourcePassage = z.infer<typeof sourcePassageSchema>

/** Tradition — stödpost, aldrig primary navigation (library.md). */
export const traditionSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(1),
  status: statusSchema,
  description: z.string().optional(),
  keywords: keywordsSchema,
})
export type Tradition = z.infer<typeof traditionSchema>

/** Person — referenspunkt, inte ingång (library.md, People and Authors). */
export const personSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(1),
  years: z.string().optional(),
  // Kort igenkännande rad för sökresultat och listor (search.md, Person
  // Result: »short identifying description«) — porträttets brödtext är för
  // lång och börjar ofta med födelsedata.
  shortDescription: z.string().optional(),
  traditions: z.array(idSchema).optional(),
  status: statusSchema,
  description: z.string().optional(),
})
export type Person = z.infer<typeof personSchema>

/** Hela den redaktionella innehållsmängden, som korsvalideringen arbetar på. */
export type ContentSet = {
  rooms: Room[]
  themes: Theme[]
  questions: Question[]
  paths: Path[]
  sources: Source[]
  passages: SourcePassage[]
  traditions: Tradition[]
  people: Person[]
}
