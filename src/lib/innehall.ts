// Laddar det redaktionella innehållet (markdown med frontmatter) in i appen.
// Vites glob läser filerna som råtext vid bygget; tolkningen och valideringen
// delas med scripts/validera-innehall.ts, som redan stoppat ogiltigt innehåll
// i check-kedjan — fel här ska därför inte inträffa, men sväljs lugnt och
// loggas i stället för att fälla appen.
import {
  fragaSchema,
  kallaSchema,
  temaSchema,
  traditionSchema,
  vandringSchema,
  type Fraga,
  type Kalla,
  type Rum,
  type Tema,
  type Tradition,
  type Vandring,
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

export const allaTeman: Tema[] = samla(
  tillFiler(import.meta.glob<string>('../content/teman/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(temaSchema, fil),
)

/** Tröskelns teman (home-and-entry.md): redaktionell ordning, aldrig arkiverade. */
export const troskelTeman: Tema[] = allaTeman
  .filter((tema) => tema.status !== 'arkiverad')
  .sort(
    (a, b) =>
      (a.ordning ?? Number.MAX_SAFE_INTEGER) - (b.ordning ?? Number.MAX_SAFE_INTEGER) ||
      a.etikett.localeCompare(b.etikett, 'sv'),
  )

export const allaFragor: Fraga[] = samla(
  tillFiler(import.meta.glob<string>('../content/fragor/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(fragaSchema, fil),
)

export const allaKallor: Kalla[] = samla(
  tillFiler(import.meta.glob<string>('../content/kallor/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(kallaSchema, fil),
)

export const allaVandringar: Vandring[] = samla(
  tillFiler(import.meta.glob<string>('../content/vandringar/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(vandringSchema, fil),
)

export const allaTraditioner: Tradition[] = samla(
  tillFiler(import.meta.glob<string>('../content/traditioner/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(traditionSchema, fil),
)

export const hittaRum = (slug: string): Rum | undefined =>
  allaRum.find((rum) => rum.slug === slug)

export const hittaRumViaId = (id: string): Rum | undefined =>
  allaRum.find((rum) => rum.id === id)

export const hittaTema = (id: string): Tema | undefined =>
  allaTeman.find((tema) => tema.id === id)

export const hittaTemaViaSlug = (slug: string): Tema | undefined =>
  allaTeman.find((tema) => tema.slug === slug)

export const hittaFraga = (id: string): Fraga | undefined =>
  allaFragor.find((fråga) => fråga.id === id)

export const hittaFragaViaSlug = (slug: string): Fraga | undefined =>
  allaFragor.find((fråga) => fråga.slug === slug)

export const hittaKalla = (id: string): Kalla | undefined =>
  allaKallor.find((källa) => källa.id === id)

export const hittaKallaViaSlug = (slug: string): Kalla | undefined =>
  allaKallor.find((källa) => källa.slug === slug)

export const hittaTradition = (id: string): Tradition | undefined =>
  allaTraditioner.find((tradition) => tradition.id === id)

export const hittaVandringViaSlug = (slug: string): Vandring | undefined =>
  allaVandringar.find((vandring) => vandring.slug === slug)

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
