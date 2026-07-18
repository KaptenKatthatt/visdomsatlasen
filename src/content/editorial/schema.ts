// Editorial content models (roadmap phase 2). The structure follows the specs
// (room-schema.md, source-and-context.md, paths.md, room-selection.md) but the
// field names and values are Swedish — the frontmatter is the editor's language.
// The content lives in Markdown with frontmatter under src/content/<type>/.
import { z } from 'zod'

/** Publication status — only `published` may be shown to readers. */
const statusSchema = z.enum(['draft', 'review', 'published', 'archived'])

// Slugs are ascii-kebab (Swedish words written without åäö: "det-du-inte-kan-styra")
// since they are used in URLs.
const slugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ogiltig slug (ascii-kebab)')
const idSchema = z.string().min(1)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'datum som ÅÅÅÅ-MM-DD')

// Editorial search keywords (search.md, Editorial Keywords): synonyms, common
// user language and alternative spellings that only improve discoverability in search.
// Never visible in the regular UI; search folds them in for matching.
const keywordsSchema = z.array(z.string().min(1)).optional()

/** How a room uses a source (source-and-context.md, Types of Source Use). */
const useSchema = z.enum([
  'quote',
  'translation',
  'paraphrase',
  'adaptation',
  'inspiration',
  'compilation',
  'historical-context',
])

/** Relation room → source; declared in the room's frontmatter under `sources:`. */
const sourceRelationSchema = z.object({
  source: idSchema,
  passage: idSchema.optional(),
  // Free-text reference until source passages exist as their own posts, e.g. "avsnitt 1".
  reference: z.string().min(1).optional(),
  use: useSchema,
  primary: z.boolean().default(false),
  editorialNote: z.string().optional(),
})

/** Editorial responsibility (source-and-context.md, Editorial Responsibility). */
const editorialSchema = z.object({
  writer: z.string().optional(),
  sourceReviewer: z.string().optional(),
  languageReviewer: z.string().optional(),
  reviewed: dateSchema.optional(),
  notes: z.string().optional(),
  version: z.number().int().min(1).default(1),
})

/** A reflection room. `opening`/`core`/`historicalContext` are filled from the
 * markdown body's ## sections by the parser, not from frontmatter. */
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

/** Theme — a broad human entry point at the threshold (home-and-entry.md). The
 * rooms own the relation via `themes`; the theme only points to its editorial default room. */
export const themeSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  label: z.string().min(1),
  defaultRoom: idSchema.optional(),
  // Editorial order at the threshold (home-and-entry.md); lowest first.
  order: z.number().int().min(1).optional(),
  status: statusSchema,
  description: z.string().optional(),
  keywords: keywordsSchema,
})
export type Theme = z.infer<typeof themeSchema>

/** Human question — the heart of the taxonomy (question-taxonomy.md). */
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

/** Path — a curated sequence of rooms (paths.md, Data Requirements). */
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

/** Canonical source record (source-and-context.md, Suggested Source Model). */
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
  // Works in the library database link here, so rooms can reach exact verses.
  libraryWork: z.string().optional(),
  status: statusSchema,
  description: z.string().optional(),
  // Alternative names for the source (search.md): original-language or translated
  // titles and established abbreviations, e.g. "Epictetus", "Handboken".
  alias: z.array(z.string().min(1)).optional(),
  keywords: keywordsSchema,
})
export type Source = z.infer<typeof sourceSchema>

/** Source passage (source-and-context.md, Suggested Passage Model). */
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

/** Tradition — a supporting record, never primary navigation (library.md). */
export const traditionSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(1),
  status: statusSchema,
  description: z.string().optional(),
  keywords: keywordsSchema,
})
export type Tradition = z.infer<typeof traditionSchema>

/** Person — a reference point, not an entry point (library.md, People and Authors). */
export const personSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  name: z.string().min(1),
  years: z.string().optional(),
  // Short identifying line for search results and lists (search.md, Person
  // Result: »short identifying description«) — the portrait's body text is too
  // long and often starts with birth data.
  shortDescription: z.string().optional(),
  traditions: z.array(idSchema).optional(),
  status: statusSchema,
  description: z.string().optional(),
})
export type Person = z.infer<typeof personSchema>

/** The entire editorial content set, which cross-validation operates on. */
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
