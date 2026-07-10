// Laddar det redaktionella innehållet (markdown med frontmatter) in i appen.
// Vites glob läser filerna som råtext vid bygget; tolkningen och valideringen
// delas med scripts/validera-innehall.ts, som redan stoppat ogiltigt innehåll
// i check-kedjan — fel här ska därför inte inträffa, men sväljs lugnt och
// loggas i stället för att fälla appen.
import {
  kallaSchema,
  temaSchema,
  type Kalla,
  type Rum,
  type Tema,
} from '../content/redaktion/schema'
import { tolkaPostfil, tolkaRumsfil, type Innehallsfil, type Tolkning } from '../content/redaktion/tolka'

const tillFiler = (moduler: Record<string, string>): Innehallsfil[] =>
  Object.entries(moduler).map(([sökväg, råtext]) => ({ sökväg, råtext }))

const samla = <T>(filer: Innehallsfil[], tolka: (fil: Innehallsfil) => Tolkning<T>): T[] =>
  filer.flatMap((fil) => {
    const tolkning = tolka(fil)
    for (const fel of tolkning.fel) console.error('[innehåll]', fel)
    return tolkning.värde ? [tolkning.värde] : []
  })

export const allaRum: Rum[] = samla(
  tillFiler(import.meta.glob<string>('../content/rum/*.md', { query: '?raw', import: 'default', eager: true })),
  tolkaRumsfil,
)

const allaTeman: Tema[] = samla(
  tillFiler(import.meta.glob<string>('../content/teman/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(temaSchema, fil),
)

const allaKallor: Kalla[] = samla(
  tillFiler(import.meta.glob<string>('../content/kallor/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(kallaSchema, fil),
)

export const hittaRum = (slug: string): Rum | undefined =>
  allaRum.find((rum) => rum.slug === slug)

export const hittaTema = (id: string): Tema | undefined =>
  allaTeman.find((tema) => tema.id === id)

export const hittaKalla = (id: string): Kalla | undefined =>
  allaKallor.find((källa) => källa.id === id)

/** Delar prosatext i stycken på tomrad — rummens sektioner är ren prosa. */
export const stycken = (text: string): string[] =>
  text
    .split(/\n\s*\n/)
    .map((stycke) => stycke.replace(/\s*\n\s*/g, ' ').trim())
    .filter((stycke) => stycke.length > 0)

/** Namnet i kolofonen: den tillskrivna rösten före nedtecknaren före verket. */
export const kallnamn = (källa: Kalla): string =>
  källa.tillskrivenFörfattare ?? källa.författare ?? källa.titel

/** Kort svensk deklaration av hur rummet använder källan (source-and-context.md). */
export const brukEtikett: Record<Rum['källor'][number]['bruk'], string> = {
  'citat': 'Direkt citat.',
  'översättning': 'Egen svensk översättning.',
  'parafras': 'Parafraserad återgivning.',
  'bearbetning': 'Bearbetad för reflektion.',
  'inspiration': 'Redaktionell reflektion inspirerad av källan.',
  'sammanställning': 'Redaktionell sammanställning av flera källor.',
  'historisk-kontext': 'Historisk bakgrundskälla.',
}
