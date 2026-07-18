// Parses editorial Markdown files: YAML frontmatter between `---` lines, then
// body text. Rooms split the body into ## sections (Opening/Core/Historical
// context); simple posts (theme, question, source …) let the body become the
// description. Errors are reported with the file path so they can be fixed directly.
import { parse as tolkaYaml } from 'yaml'
import type { z } from 'zod'
import { roomSchema, type Room } from './schema'

export type ContentFile = { filePath: string; rawText: string }
export type Parsed<T> = { value: T | null; errors: string[] }

// Markdown section heading → field on the room. Unknown headings are errors, so
// a typo doesn't silently swallow text.
const SECTIONS: Record<string, 'opening' | 'core' | 'historicalContext'> = {
  'Opening': 'opening',
  'Core': 'core',
  'Historical context': 'historicalContext',
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

type SplitFile = { frontmatter: Record<string, unknown>; kropp: string }

const splitFrontmatter = (fil: ContentFile): Parsed<SplitFile> => {
  const hit = FRONTMATTER.exec(fil.rawText)
  if (!hit || hit[1] === undefined || hit[2] === undefined) {
    return { value: null, errors: [`${fil.filePath}: saknar frontmatter (--- ... ---)`] }
  }
  let data: unknown
  try {
    data = tolkaYaml(hit[1]) as unknown
  } catch (cause: unknown) {
    const description = cause instanceof Error ? cause.message : String(cause)
    return { value: null, errors: [`${fil.filePath}: ogiltig yaml i frontmatter — ${description}`] }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { value: null, errors: [`${fil.filePath}: frontmatter måste vara nyckel–värde-par`] }
  }
  return { value: { frontmatter: { ...data }, kropp: hit[2] }, errors: [] }
}

const formateraError = (filePath: string, issues: readonly z.core.$ZodIssue[]): string[] =>
  issues.map((issue) => {
    const field = issue.path.length > 0 ? issue.path.map(String).join('.') : '(rot)'
    return `${filePath}: ${field} — ${issue.message}`
  })

/** Splits a markdown body into sections by `## Heading`. Text before the first
 * heading is ignored (unused in the room format). */
const splitSections = (body: string): Map<string, string> => {
  const sections = new Map<string, string>()
  let current: string | null = null
  let rows: string[] = []
  const save = () => {
    if (current !== null) sections.set(current, rows.join('\n').trim())
  }
  for (const rad of body.split(/\r?\n/)) {
    const rubrik = /^##\s+(.+?)\s*$/.exec(rad)
    if (rubrik?.[1] !== undefined) {
      save()
      current = rubrik[1]
      rows = []
    } else {
      rows.push(rad)
    }
  }
  save()
  return sections
}

type RoomFields = Partial<Record<'opening' | 'core' | 'historicalContext', string>>

const roomSections = (filePath: string, body: string): Parsed<RoomFields> => {
  const fel: string[] = []
  const field: RoomFields = {}
  for (const [rubrik, text] of splitSections(body)) {
    const name = SECTIONS[rubrik]
    if (!name) fel.push(`${filePath}: okänd sektion "## ${rubrik}"`)
    else if (text.length > 0) field[name] = text
  }
  for (const required of ['Opening', 'Core'] as const) {
    const name = SECTIONS[required]
    if (name && field[name] === undefined) fel.push(`${filePath}: saknar sektionen "## ${required}"`)
  }
  return fel.length > 0 ? { value: null, errors: fel } : { value: field, errors: [] }
}

/** Parses and validates a room (frontmatter + ## sections). */
export const parseRoomFile = (fil: ContentFile): Parsed<Room> => {
  const split = splitFrontmatter(fil)
  if (!split.value) return { value: null, errors: split.errors }
  const sections = roomSections(fil.filePath, split.value.kropp)
  if (!sections.value) return { value: null, errors: sections.errors }
  const parsed = roomSchema.safeParse({ ...split.value.frontmatter, ...sections.value })
  if (!parsed.success) return { value: null, errors: formateraError(fil.filePath, parsed.error.issues) }
  return { value: parsed.data, errors: [] }
}

/** Parses and validates a simple post (theme, question, source, path …).
 * The body text becomes `description` when it is not empty. */
export const parsePostFile = <T>(schema: z.ZodType<T>, fil: ContentFile): Parsed<T> => {
  const split = splitFrontmatter(fil)
  if (!split.value) return { value: null, errors: split.errors }
  const body = split.value.kropp.trim()
  const kandidat =
    body.length > 0 ? { ...split.value.frontmatter, description: body } : split.value.frontmatter
  const parsed = schema.safeParse(kandidat)
  if (!parsed.success) return { value: null, errors: formateraError(fil.filePath, parsed.error.issues) }
  return { value: parsed.data, errors: [] }
}
