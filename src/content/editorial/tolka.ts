// Tolkar redaktionella Markdown-filer: YAML-frontmatter mellan `---`-linjer,
// därefter brödtext. Rum delar upp kroppen i ##-sektioner (Öppning/Kärna/
// Historisk kontext); enkla poster (tema, fråga, source …) låter kroppen bli
// description. Fel rapporteras med filsökväg så de går att åtgärda direkt.
import { parse as tolkaYaml } from 'yaml'
import type { z } from 'zod'
import { rumSchema, type Rum } from './schema'

export type Innehallsfil = { sökväg: string; råtext: string }
export type Tolkning<T> = { värde: T | null; fel: string[] }

// Sektionsrubrik i markdown → fält på rummet. Okända rubriker är fel, så
// stavfel inte tyst sväljer text.
const SEKTIONER: Record<string, 'opening' | 'core' | 'historicalContext'> = {
  'Opening': 'opening',
  'Core': 'core',
  'Historical context': 'historicalContext',
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

type DeladFil = { frontmatter: Record<string, unknown>; kropp: string }

const delaFrontmatter = (fil: Innehallsfil): Tolkning<DeladFil> => {
  const träff = FRONTMATTER.exec(fil.råtext)
  if (!träff || träff[1] === undefined || träff[2] === undefined) {
    return { värde: null, fel: [`${fil.sökväg}: saknar frontmatter (--- ... ---)`] }
  }
  let data: unknown
  try {
    data = tolkaYaml(träff[1]) as unknown
  } catch (orsak: unknown) {
    const description = orsak instanceof Error ? orsak.message : String(orsak)
    return { värde: null, fel: [`${fil.sökväg}: ogiltig yaml i frontmatter — ${description}`] }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { värde: null, fel: [`${fil.sökväg}: frontmatter måste vara nyckel–värde-par`] }
  }
  return { värde: { frontmatter: { ...data }, kropp: träff[2] }, fel: [] }
}

const formateraFel = (sökväg: string, brister: readonly z.core.$ZodIssue[]): string[] =>
  brister.map((brist) => {
    const fält = brist.path.length > 0 ? brist.path.map(String).join('.') : '(rot)'
    return `${sökväg}: ${fält} — ${brist.message}`
  })

/** Delar en markdown-kropp i sektioner per `## Rubrik`. Text före första
 * rubriken ignoreras (används inte i rumsformatet). */
const delaSektioner = (kropp: string): Map<string, string> => {
  const sektioner = new Map<string, string>()
  let aktuell: string | null = null
  let rader: string[] = []
  const spara = () => {
    if (aktuell !== null) sektioner.set(aktuell, rader.join('\n').trim())
  }
  for (const rad of kropp.split(/\r?\n/)) {
    const rubrik = /^##\s+(.+?)\s*$/.exec(rad)
    if (rubrik?.[1] !== undefined) {
      spara()
      aktuell = rubrik[1]
      rader = []
    } else {
      rader.push(rad)
    }
  }
  spara()
  return sektioner
}

type Rumsfält = Partial<Record<'opening' | 'core' | 'historicalContext', string>>

const rumssektioner = (sökväg: string, kropp: string): Tolkning<Rumsfält> => {
  const fel: string[] = []
  const fält: Rumsfält = {}
  for (const [rubrik, text] of delaSektioner(kropp)) {
    const name = SEKTIONER[rubrik]
    if (!name) fel.push(`${sökväg}: okänd sektion "## ${rubrik}"`)
    else if (text.length > 0) fält[name] = text
  }
  for (const krävd of ['Opening', 'Core'] as const) {
    const name = SEKTIONER[krävd]
    if (name && fält[name] === undefined) fel.push(`${sökväg}: saknar sektionen "## ${krävd}"`)
  }
  return fel.length > 0 ? { värde: null, fel } : { värde: fält, fel: [] }
}

/** Tolkar och validerar ett rum (frontmatter + ##-sektioner). */
export const tolkaRumsfil = (fil: Innehallsfil): Tolkning<Rum> => {
  const delad = delaFrontmatter(fil)
  if (!delad.värde) return { värde: null, fel: delad.fel }
  const sektioner = rumssektioner(fil.sökväg, delad.värde.kropp)
  if (!sektioner.värde) return { värde: null, fel: sektioner.fel }
  const tolkat = rumSchema.safeParse({ ...delad.värde.frontmatter, ...sektioner.värde })
  if (!tolkat.success) return { värde: null, fel: formateraFel(fil.sökväg, tolkat.error.issues) }
  return { värde: tolkat.data, fel: [] }
}

/** Tolkar och validerar en enkel post (tema, fråga, source, vandring …).
 * Brödtexten blir `description` när den inte är tom. */
export const tolkaPostfil = <T>(schema: z.ZodType<T>, fil: Innehallsfil): Tolkning<T> => {
  const delad = delaFrontmatter(fil)
  if (!delad.värde) return { värde: null, fel: delad.fel }
  const kropp = delad.värde.kropp.trim()
  const kandidat =
    kropp.length > 0 ? { ...delad.värde.frontmatter, description: kropp } : delad.värde.frontmatter
  const tolkat = schema.safeParse(kandidat)
  if (!tolkat.success) return { värde: null, fel: formateraFel(fil.sökväg, tolkat.error.issues) }
  return { värde: tolkat.data, fel: [] }
}
