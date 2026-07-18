// Laddar det redaktionella innehållet (markdown med frontmatter) in i appen.
// Vites glob läser filerna som råtext vid bygget; tolkningen och valideringen
// delas med scripts/validera-innehall.ts, som redan stoppat ogiltigt innehåll
// i check-kedjan — fel här ska därför inte inträffa, men sväljs lugnt och
// loggas i stället för att fälla appen.
import {
  fragaSchema,
  kallaSchema,
  kallpassageSchema,
  traditionSchema,
  vandringSchema,
  type Question,
  type Source,
  type SourcePassage,
  type Room,
  type Theme,
  type Tradition,
  type Path,
} from '../content/editorial/schema'
import { samla, tillFiler } from '../content/editorial/samla'
import { tolkaPostfil, tolkaRumsfil } from '../content/editorial/tolka'
// Temana (och tröskelns urval) bor i det lätta troskeldata.ts så hemskärmen kan
// nå dem utan att dra in rummens brödtext; här återexporteras de så bibliotekets
// uppslag (hittaTema m.fl.) och sökindexet fortsatt kan gå via innehall.
import { allaTeman, troskelTeman } from './troskeldata'

export { allaTeman, troskelTeman }

export const allaRum: Room[] = samla(
  tillFiler(import.meta.glob<string>('../content/rooms/*.md', { query: '?raw', import: 'default', eager: true })),
  tolkaRumsfil,
)

export const allaFragor: Question[] = samla(
  tillFiler(import.meta.glob<string>('../content/questions/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(fragaSchema, fil),
)

export const allaKallor: Source[] = samla(
  tillFiler(import.meta.glob<string>('../content/sources/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(kallaSchema, fil),
)

export const allaVandringar: Path[] = samla(
  tillFiler(import.meta.glob<string>('../content/paths/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(vandringSchema, fil),
)

/** Källpassager — kanoniska textutdrag med reference, edition och translation
 * (source-and-context.md, Suggested Passage Model). Rum pekar hit via
 * relationens `passage`, så källans ord hålls åtskilda från redaktionell prosa. */
export const allaPassager: SourcePassage[] = samla(
  tillFiler(import.meta.glob<string>('../content/passages/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(kallpassageSchema, fil),
)

export const allaTraditioner: Tradition[] = samla(
  tillFiler(import.meta.glob<string>('../content/traditions/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(traditionSchema, fil),
)

export const hittaRum = (slug: string): Room | undefined =>
  allaRum.find((rum) => rum.slug === slug)

export const hittaRumViaId = (id: string): Room | undefined =>
  allaRum.find((rum) => rum.id === id)

export const hittaTema = (id: string): Theme | undefined =>
  allaTeman.find((tema) => tema.id === id)

export const hittaTemaViaSlug = (slug: string): Theme | undefined =>
  allaTeman.find((tema) => tema.slug === slug)

export const hittaFraga = (id: string): Question | undefined =>
  allaFragor.find((fråga) => fråga.id === id)

export const hittaFragaViaSlug = (slug: string): Question | undefined =>
  allaFragor.find((fråga) => fråga.slug === slug)

export const hittaKalla = (id: string): Source | undefined =>
  allaKallor.find((source) => source.id === id)

export const hittaKallaViaSlug = (slug: string): Source | undefined =>
  allaKallor.find((source) => source.slug === slug)

export const hittaTradition = (id: string): Tradition | undefined =>
  allaTraditioner.find((tradition) => tradition.id === id)

export const hittaVandringViaSlug = (slug: string): Path | undefined =>
  allaVandringar.find((vandring) => vandring.slug === slug)

export const hittaVandringViaId = (id: string): Path | undefined =>
  allaVandringar.find((vandring) => vandring.id === id)

export const hittaPassage = (id: string): SourcePassage | undefined =>
  allaPassager.find((passage) => passage.id === id)

/** Delar prosatext i stycken på tomrad — rummens sektioner är ren prosa. */
export const stycken = (text: string): string[] =>
  text
    .split(/\n\s*\n/)
    .map((stycke) => stycke.replace(/\s*\n\s*/g, ' ').trim())
    .filter((stycke) => stycke.length > 0)

/** Namnet i kolofonen: den tillskrivna rösten före nedtecknaren före verket. */
export const kallnamn = (source: Source): string =>
  source.attributedAuthor ?? source.author ?? source.title

/** Ärliga osäkerhetsmeningar i klartext (source-and-context.md, Uncertainty):
 * dold osäkerhet försvagar tilliten, inte källan. Delas av läsrummet och
 * källsidan så samma formulering möter läsaren på båda ställena. */
export const osakerheter = (source: Source): string[] => {
  const name = source.attributedAuthor ?? source.author ?? 'annan hand'
  const rader: string[] = []
  if (source.attribution === 'tillskrivet')
    rader.push(`Verket tillskrivs traditionellt ${name}; författarskapet är inte säkert belagt.`)
  if (source.attribution === 'omtvistat') rader.push('Författarskapet är omdiskuterat.')
  if (source.attribution === 'okänt') rader.push('Upphovspersonen är okänd.')
  if (source.dating === 'ungefärlig') rader.push('Textens exakta dating är osäker.')
  if (source.dating === 'omtvistad') rader.push('Textens dating är omtvistad.')
  if (source.dating === 'okänd') rader.push('När texten tillkom är okänt.')
  return rader
}

/** Kort svensk deklaration av hur rummet använder källan (source-and-context.md). */
export const brukEtikett: Record<Room['sources'][number]['use'], string> = {
  'citat': 'Direkt citat.',
  'translation': 'Egen svensk translation.',
  'parafras': 'Parafraserad återgivning.',
  'bearbetning': 'Bearbetad för reflektion.',
  'inspiration': 'Redaktionell reflektion inspirerad av källan.',
  'sammanställning': 'Redaktionell sammanställning av flera sources.',
  'historisk-kontext': 'Historisk bakgrundskälla.',
}
