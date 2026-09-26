// The published editorial content as plain JSON, for readers outside the web app.
// The first reader is Hackytel's E Ink tablet, which carries Visdomsatlasen offline
// (spec: KaptenKatthatt/hackyytel, docs/superpowers/specs/2026-09-24-visdomsatlasen-design.md,
// "Innehållspaketet"). The build writes this to dist/atlas-content.json; the server adds
// the works and their verses from its database when it sends the bundle to Hackytel.
//
// Only `published` records are exported, the same selection the app shows. Prose is
// split into paragraphs here so no reader has to repeat the rule; editorial metadata
// (writer, review dates, notes, keywords) stays behind.
import { paragraphs } from './paragraphs'
import type { ContentSet, Path, Question, Room, Source, SourcePassage, Theme, Tradition } from './schema'

/** Text that may run over several paragraphs, kept as one string with a blank line between them. */
const prose = (text: string | undefined): string => paragraphs(text ?? '').join('\n\n')

type ExportTheme = { id: string; slug: string; label: string; order: number; summary: string; defaultRoom: string | null }
type ExportQuestion = { id: string; slug: string; text: string }
type ExportTradition = { id: string; slug: string; name: string; summary: string }
type ExportSource = {
  id: string
  slug: string
  title: string
  shortTitle: string | null
  author: string | null
  attributedAuthor: string | null
  traditions: string[]
  dating: string | null
  place: string | null
  libraryWork: string | null
  description: string
}
type ExportPassage = {
  id: string
  source: string
  reference: string
  translation: string
  translator: string | null
  edition: string | null
}
type ExportRoom = {
  id: string
  slug: string
  title: string
  summary: string
  primaryQuestion: string
  themes: string[]
  thoughtToCarry: string
  reflectionQuestions: string[]
  sources: { source: string; passage?: string; reference?: string; use: string; primary: boolean }[]
  readingTimeMinutes: number
  opening: string[]
  core: string[]
  historicalContext: string[]
}
type ExportPath = {
  id: string
  slug: string
  title: string
  introduction: string
  centralQuestion: string
  rooms: string[]
  closingReflection: string
}

export type AtlasContent = {
  format: 1
  language: 'sv'
  themes: ExportTheme[]
  questions: ExportQuestion[]
  traditions: ExportTradition[]
  sources: ExportSource[]
  passages: ExportPassage[]
  rooms: ExportRoom[]
  paths: ExportPath[]
}

const published = <T extends { status: string }>(records: T[]): T[] =>
  records.filter((record) => record.status === 'published')

// Themes carry their editorial order as 1..n: the threshold's order without gaps, and
// an unordered theme after the ordered ones, alphabetically, as the app places it.
const exportThemes = (themes: Theme[]): ExportTheme[] =>
  [...themes]
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.label.localeCompare(b.label, 'sv'))
    .map((theme, index) => ({
      id: theme.id,
      slug: theme.slug,
      label: theme.label,
      order: index + 1,
      summary: prose(theme.description),
      defaultRoom: theme.defaultRoom ?? null,
    }))

const exportQuestion = (question: Question): ExportQuestion => ({
  id: question.id,
  slug: question.slug,
  text: question.text,
})

const exportTradition = (tradition: Tradition): ExportTradition => ({
  id: tradition.id,
  slug: tradition.slug,
  name: tradition.name,
  summary: prose(tradition.description),
})

const exportSource = (source: Source): ExportSource => ({
  id: source.id,
  slug: source.slug,
  title: source.title,
  shortTitle: source.shortTitle ?? null,
  author: source.author ?? null,
  attributedAuthor: source.attributedAuthor ?? null,
  traditions: source.traditions ?? [],
  dating: source.approximateDating ?? null,
  place: source.place ?? null,
  libraryWork: source.libraryWork ?? null,
  description: prose(source.description),
})

const exportPassage = (passage: SourcePassage): ExportPassage => ({
  id: passage.id,
  source: passage.source,
  reference: passage.reference,
  translation: prose(passage.translation),
  translator: passage.translator ?? null,
  edition: passage.edition ?? null,
})

// The relation drops its editorial note, and optional keys stay absent rather than null
// so the shape matches the frontmatter the editor wrote.
const exportRelation = (relation: Room['sources'][number]): ExportRoom['sources'][number] => ({
  source: relation.source,
  ...(relation.passage === undefined ? {} : { passage: relation.passage }),
  ...(relation.reference === undefined ? {} : { reference: relation.reference }),
  use: relation.use,
  primary: relation.primary,
})

const exportRoom = (room: Room): ExportRoom => ({
  id: room.id,
  slug: room.slug,
  title: room.title,
  summary: room.summary,
  primaryQuestion: room.primaryQuestion,
  themes: room.themes,
  thoughtToCarry: room.thoughtToCarry,
  reflectionQuestions: room.reflectionQuestions,
  sources: room.sources.map(exportRelation),
  readingTimeMinutes: room.readingTimeMinutes,
  opening: paragraphs(room.opening),
  core: paragraphs(room.core),
  historicalContext: paragraphs(room.historicalContext ?? ''),
})

const exportPath = (path: Path): ExportPath => ({
  id: path.id,
  slug: path.slug,
  title: path.title,
  introduction: prose(path.introduction),
  centralQuestion: path.centralQuestion,
  rooms: path.rooms,
  closingReflection: prose(path.closingReflection),
})

/** The published editorial content in the bundle's shape, without works, version or build time. */
export const exportContent = (set: ContentSet): AtlasContent => ({
  format: 1,
  language: 'sv',
  themes: exportThemes(published(set.themes)),
  questions: published(set.questions).map(exportQuestion),
  traditions: published(set.traditions).map(exportTradition),
  sources: published(set.sources).map(exportSource),
  passages: published(set.passages).map(exportPassage),
  rooms: published(set.rooms).map(exportRoom),
  paths: published(set.paths).map(exportPath),
})
