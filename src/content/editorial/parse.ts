// Tolkar redaktionella Markdown-filer: YAML-frontmatter mellan `---`-linjer,
// därefter brödtext. Rum delar upp kroppen i ##-sektioner (Öppning/Kärna/
// Historisk kontext); enkla poster (tema, fråga, source …) låter kroppen bli
// description. Fel rapporteras med filsökväg så de går att åtgärda direkt.
import { parse as tolkaYaml } from 'yaml'
import type { z } from 'zod'
import { roomSchema, type Room } from './schema'

export type ContentFile = { filePath: string; rawText: string }
export type Parsed<T> = { value: T | null; errors: string[] }

// Sektionsrubrik i markdown → fält på rummet. Okända rubriker är fel, så
// stavfel inte tyst sväljer text.
const SEKTIONER: Record<string, 'opening' | 'core' | 'historicalContext'> = {
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
  } catch (orsak: unknown) {
    const description = orsak instanceof Error ? orsak.message : String(orsak)
    return { value: null, errors: [`${fil.filePath}: ogiltig yaml i frontmatter — ${description}`] }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { value: null, errors: [`${fil.filePath}: frontmatter måste vara nyckel–värde-par`] }
  }
  return { value: { frontmatter: { ...data }, kropp: hit[2] }, errors: [] }
}

const formateraError = (sökväg: string, brister: readonly z.core.$ZodIssue[]): string[] =>
  brister.map((brist) => {
    const field = brist.path.length > 0 ? brist.path.map(String).join('.') : '(rot)'
    return `${sökväg}: ${field} — ${brist.message}`
  })

/** Delar en markdown-kropp i sektioner per `## Rubrik`. Text före första
 * rubriken ignoreras (används inte i rumsformatet). */
const splitSections = (kropp: string): Map<string, string> => {
  const sektioner = new Map<string, string>()
  let aktuell: string | null = null
  let rows: string[] = []
  const save = () => {
    if (aktuell !== null) sektioner.set(aktuell, rows.join('\n').trim())
  }
  for (const rad of kropp.split(/\r?\n/)) {
    const rubrik = /^##\s+(.+?)\s*$/.exec(rad)
    if (rubrik?.[1] !== undefined) {
      save()
      aktuell = rubrik[1]
      rows = []
    } else {
      rows.push(rad)
    }
  }
  save()
  return sektioner
}

type RoomFields = Partial<Record<'opening' | 'core' | 'historicalContext', string>>

const rumssektioner = (sökväg: string, kropp: string): Parsed<RoomFields> => {
  const fel: string[] = []
  const field: RoomFields = {}
  for (const [rubrik, text] of splitSections(kropp)) {
    const name = SEKTIONER[rubrik]
    if (!name) fel.push(`${sökväg}: okänd sektion "## ${rubrik}"`)
    else if (text.length > 0) field[name] = text
  }
  for (const required of ['Opening', 'Core'] as const) {
    const name = SEKTIONER[required]
    if (name && field[name] === undefined) fel.push(`${sökväg}: saknar sektionen "## ${required}"`)
  }
  return fel.length > 0 ? { value: null, errors: fel } : { value: field, errors: [] }
}

/** Tolkar och validerar ett rum (frontmatter + ##-sektioner). */
export const parseRoomFile = (fil: ContentFile): Parsed<Room> => {
  const split = splitFrontmatter(fil)
  if (!split.value) return { value: null, errors: split.errors }
  const sektioner = rumssektioner(fil.filePath, split.value.kropp)
  if (!sektioner.value) return { value: null, errors: sektioner.errors }
  const parsed = roomSchema.safeParse({ ...split.value.frontmatter, ...sektioner.value })
  if (!parsed.success) return { value: null, errors: formateraError(fil.filePath, parsed.error.issues) }
  return { value: parsed.data, errors: [] }
}

/** Tolkar och validerar en enkel post (tema, fråga, source, vandring …).
 * Brödtexten blir `description` när den inte är tom. */
export const parsePostFile = <T>(schema: z.ZodType<T>, fil: ContentFile): Parsed<T> => {
  const split = splitFrontmatter(fil)
  if (!split.value) return { value: null, errors: split.errors }
  const kropp = split.value.kropp.trim()
  const kandidat =
    kropp.length > 0 ? { ...split.value.frontmatter, description: kropp } : split.value.frontmatter
  const parsed = schema.safeParse(kandidat)
  if (!parsed.success) return { value: null, errors: formateraError(fil.filePath, parsed.error.issues) }
  return { value: parsed.data, errors: [] }
}
