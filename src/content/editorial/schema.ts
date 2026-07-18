// Redaktionella innehållsmodeller (roadmap fas 2). Strukturen följer specarna
// (room-schema.md, source-and-context.md, paths.md, room-selection.md) men
// fältnamn och värden är svenska — frontmattern är redaktörens language.
// Innehållet bor i Markdown med frontmatter under src/content/<type>/.
import { z } from 'zod'

/** Publiceringsstatus — endast `publicerad` får synas för läsare. */
const statusSchema = z.enum(['utkast', 'granskning', 'publicerad', 'arkiverad'])

// Sluggar är ascii-kebab (svenska ord skrivs utan åäö: "det-du-inte-kan-styra")
// eftersom de används i URL:er.
const slugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ogiltig slug (ascii-kebab)')
const idSchema = z.string().min(1)
const datumSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'datum som ÅÅÅÅ-MM-DD')

// Redaktionella sök-keywords (search.md, Editorial Keywords): synonymer, vanligt
// användarspråk och alternativa stavningar som bara förbättrar upptäckt i söket.
// Aldrig synliga i det vanliga gränssnittet; söket viker dem för matchning.
const nyckelordSchema = z.array(z.string().min(1)).optional()

/** Hur ett rum använder en source (source-and-context.md, Types of Source Use). */
const brukSchema = z.enum([
  'citat',
  'translation',
  'parafras',
  'bearbetning',
  'inspiration',
  'sammanställning',
  'historisk-kontext',
])

/** Relation rum → source; deklareras i rummets frontmatter under `sources:`. */
const kallrelationSchema = z.object({
  source: idSchema,
  passage: idSchema.optional(),
  // Fritextreferens tills källpassager finns som egna poster, t.ex. "avsnitt 1".
  reference: z.string().min(1).optional(),
  use: brukSchema,
  primary: z.boolean().default(false),
  editorialNote: z.string().optional(),
})

/** Redaktionellt ansvar (source-and-context.md, Editorial Responsibility). */
const redaktionSchema = z.object({
  writer: z.string().optional(),
  sourceReviewer: z.string().optional(),
  languageReviewer: z.string().optional(),
  reviewed: datumSchema.optional(),
  notes: z.string().optional(),
  version: z.number().int().min(1).default(1),
})

/** Ett reflektionsrum. `opening`/`core`/`historicalContext` fylls från
 * markdown-kroppens ##-sektioner av tolken, inte från frontmatter. */
export const rumSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  primaryQuestion: idSchema,
  themes: z.array(idSchema).min(1),
  thoughtToCarry: z.string().min(1),
  reflectionQuestions: z.array(z.string().min(1)).min(1).max(5),
  sources: z.array(kallrelationSchema).min(1),
  readingTimeMinutes: z.number().int().min(1),
  language: z.string().default('sv'),
  status: statusSchema,
  created: datumSchema,
  updated: datumSchema,
  editorial: redaktionSchema.optional(),
  tags: z.array(z.string().min(1)).optional(),
  relatedQuestions: z.array(idSchema).optional(),
  opening: z.string().min(1),
  core: z.string().min(1),
  historicalContext: z.string().optional(),
})
export type Room = z.infer<typeof rumSchema>

/** Tema — bred mänsklig ingång på tröskeln (home-and-entry.md). Rummen äger
 * relationen via `themes`; temat pekar bara ut sitt redaktionella standardrum. */
export const temaSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  label: z.string().min(1),
  defaultRoom: idSchema.optional(),
  // Redaktionell order på tröskeln (home-and-entry.md); lägst först.
  order: z.number().int().min(1).optional(),
  status: statusSchema,
  description: z.string().optional(),
  keywords: nyckelordSchema,
})
export type Theme = z.infer<typeof temaSchema>

/** Mänsklig fråga — taxonomins hjärta (question-taxonomy.md). */
export const fragaSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  text: z.string().min(1),
  themes: z.array(idSchema).min(1),
  relatedQuestions: z.array(idSchema).optional(),
  status: statusSchema,
  description: z.string().optional(),
  keywords: nyckelordSchema,
})
export type Question = z.infer<typeof fragaSchema>

/** Vandring — kuraterad följd av rum (paths.md, Data Requirements). */
export const vandringSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1),
  introduction: z.string().min(1),
  centralQuestion: idSchema,
  rum: z.array(idSchema).min(3).max(7),
  closingReflection: z.string().optional(),
  status: statusSchema,
  created: datumSchema,
  updated: datumSchema,
  editorialNotes: z.string().optional(),
  keywords: nyckelordSchema,
})
export type Path = z.infer<typeof vandringSchema>

/** Kanonisk källpost (source-and-context.md, Suggested Source Model). */
export const kallaSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  title: z.string().min(1),
  originalTitle: z.string().optional(),
  type: z.enum([
    'bok',
    'skrift',
    'brev',
    'tal',
    'dikt',
    'inskrift',
    'muntlig-tradition',
    'historiskt-dokument',
    'fragment',
    'annat',
  ]),
  author: z.string().optional(),
  attributedAuthor: z.string().optional(),
  traditions: z.array(idSchema).optional(),
  originalLanguage: z.string().optional(),
  approximateDating: z.string().optional(),
  place: z.string().optional(),
  attribution: z.enum(['känt', 'tillskrivet', 'omtvistat', 'okänt']).optional(),
  dating: z.enum(['känd', 'ungefärlig', 'omtvistad', 'okänd']).optional(),
  rights: z.enum(['public-domain', 'licensierad', 'skyddad', 'okänd']),
  // Verk i biblioteksdatabasen kopplas hit, så rum kan nå exakta verser.
  libraryWork: z.string().optional(),
  status: statusSchema,
  description: z.string().optional(),
  // Alternativa name för källan (search.md): originalspråkiga eller översatta
  // titlar och etablerade förkortningar, t.ex. "Epictetus", "Handboken".
  alias: z.array(z.string().min(1)).optional(),
  keywords: nyckelordSchema,
})
export type Source = z.infer<typeof kallaSchema>

/** Källpassage (source-and-context.md, Suggested Passage Model). */
export const kallpassageSchema = z.object({
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
export type SourcePassage = z.infer<typeof kallpassageSchema>

/** Tradition — stödpost, aldrig primary navigation (library.md). */
export const traditionSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(1),
  status: statusSchema,
  description: z.string().optional(),
  keywords: nyckelordSchema,
})
export type Tradition = z.infer<typeof traditionSchema>

/** Person — referenspunkt, inte ingång (library.md, People and Authors). */
export const personSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(1),
  årtal: z.string().optional(),
  traditions: z.array(idSchema).optional(),
  status: statusSchema,
  description: z.string().optional(),
})
export type Person = z.infer<typeof personSchema>

/** Hela den redaktionella innehållsmängden, som korsvalideringen arbetar på. */
export type ContentSet = {
  rum: Room[]
  themes: Theme[]
  frågor: Question[]
  vandringar: Path[]
  sources: Source[]
  passager: SourcePassage[]
  traditions: Tradition[]
  personer: Person[]
}
