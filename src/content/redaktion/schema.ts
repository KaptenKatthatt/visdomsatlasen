// Redaktionella innehållsmodeller (roadmap fas 2). Strukturen följer specarna
// (room-schema.md, source-and-context.md, paths.md, room-selection.md) men
// fältnamn och värden är svenska — frontmattern är redaktörens språk.
// Innehållet bor i Markdown med frontmatter under src/content/<typ>/.
import { z } from 'zod'

/** Publiceringsstatus — endast `publicerad` får synas för läsare. */
const statusSchema = z.enum(['utkast', 'granskning', 'publicerad', 'arkiverad'])

// Sluggar är ascii-kebab (svenska ord skrivs utan åäö: "det-du-inte-kan-styra")
// eftersom de används i URL:er.
const slugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ogiltig slug (ascii-kebab)')
const idSchema = z.string().min(1)
const datumSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'datum som ÅÅÅÅ-MM-DD')

/** Hur ett rum använder en källa (source-and-context.md, Types of Source Use). */
const brukSchema = z.enum([
  'citat',
  'översättning',
  'parafras',
  'bearbetning',
  'inspiration',
  'sammanställning',
  'historisk-kontext',
])

/** Relation rum → källa; deklareras i rummets frontmatter under `källor:`. */
const kallrelationSchema = z.object({
  källa: idSchema,
  passage: idSchema.optional(),
  // Fritextreferens tills källpassager finns som egna poster, t.ex. "avsnitt 1".
  referens: z.string().min(1).optional(),
  bruk: brukSchema,
  primär: z.boolean().default(false),
  redaktionellNot: z.string().optional(),
})

/** Redaktionellt ansvar (source-and-context.md, Editorial Responsibility). */
const redaktionSchema = z.object({
  skribent: z.string().optional(),
  källgranskare: z.string().optional(),
  språkgranskare: z.string().optional(),
  granskad: datumSchema.optional(),
  noteringar: z.string().optional(),
  version: z.number().int().min(1).default(1),
})

/** Ett reflektionsrum. `öppning`/`kärna`/`historiskKontext` fylls från
 * markdown-kroppens ##-sektioner av tolken, inte från frontmatter. */
export const rumSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  titel: z.string().min(1),
  sammanfattning: z.string().min(1),
  primärFråga: idSchema,
  teman: z.array(idSchema).min(1),
  tankeAttBära: z.string().min(1),
  reflektionsfrågor: z.array(z.string().min(1)).min(1).max(5),
  källor: z.array(kallrelationSchema).min(1),
  lästidMinuter: z.number().int().min(1),
  språk: z.string().default('sv'),
  status: statusSchema,
  skapad: datumSchema,
  uppdaterad: datumSchema,
  redaktion: redaktionSchema.optional(),
  taggar: z.array(z.string().min(1)).optional(),
  relateradeFrågor: z.array(idSchema).optional(),
  öppning: z.string().min(1),
  kärna: z.string().min(1),
  historiskKontext: z.string().optional(),
})
export type Rum = z.infer<typeof rumSchema>

/** Tema — bred mänsklig ingång på tröskeln (home-and-entry.md). Rummen äger
 * relationen via `teman`; temat pekar bara ut sitt redaktionella standardrum. */
export const temaSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  etikett: z.string().min(1),
  standardRum: idSchema.optional(),
  // Redaktionell ordning på tröskeln (home-and-entry.md); lägst först.
  ordning: z.number().int().min(1).optional(),
  status: statusSchema,
  beskrivning: z.string().optional(),
})
export type Tema = z.infer<typeof temaSchema>

/** Mänsklig fråga — taxonomins hjärta (question-taxonomy.md). */
export const fragaSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  text: z.string().min(1),
  teman: z.array(idSchema).min(1),
  relateradeFrågor: z.array(idSchema).optional(),
  status: statusSchema,
  beskrivning: z.string().optional(),
})
export type Fraga = z.infer<typeof fragaSchema>

/** Vandring — kuraterad följd av rum (paths.md, Data Requirements). */
export const vandringSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  titel: z.string().min(1),
  introduktion: z.string().min(1),
  centralFråga: idSchema,
  rum: z.array(idSchema).min(3).max(7),
  avslutandeReflektion: z.string().optional(),
  status: statusSchema,
  skapad: datumSchema,
  uppdaterad: datumSchema,
  redaktionellaNoteringar: z.string().optional(),
})
export type Vandring = z.infer<typeof vandringSchema>

/** Kanonisk källpost (source-and-context.md, Suggested Source Model). */
export const kallaSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  titel: z.string().min(1),
  originaltitel: z.string().optional(),
  typ: z.enum([
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
  författare: z.string().optional(),
  tillskrivenFörfattare: z.string().optional(),
  traditioner: z.array(idSchema).optional(),
  originalspråk: z.string().optional(),
  ungefärligDatering: z.string().optional(),
  plats: z.string().optional(),
  upphov: z.enum(['känt', 'tillskrivet', 'omtvistat', 'okänt']).optional(),
  datering: z.enum(['känd', 'ungefärlig', 'omtvistad', 'okänd']).optional(),
  rättigheter: z.enum(['public-domain', 'licensierad', 'skyddad', 'okänd']),
  // Verk i biblioteksdatabasen kopplas hit, så rum kan nå exakta verser.
  biblioteksverk: z.string().optional(),
  status: statusSchema,
  beskrivning: z.string().optional(),
})
export type Kalla = z.infer<typeof kallaSchema>

/** Källpassage (source-and-context.md, Suggested Passage Model). */
export const kallpassageSchema = z.object({
  id: idSchema,
  källa: idSchema,
  referens: z.string().min(1),
  originaltext: z.string().optional(),
  översättning: z.string().optional(),
  översättare: z.string().optional(),
  utgåva: z.string().optional(),
  utgivningsår: z.number().int().optional(),
  url: z.string().optional(),
  noteringar: z.string().optional(),
  status: statusSchema,
})
export type Kallpassage = z.infer<typeof kallpassageSchema>

/** Tradition — stödpost, aldrig primär navigation (library.md). */
export const traditionSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  namn: z.string().min(1),
  status: statusSchema,
  beskrivning: z.string().optional(),
})
export type Tradition = z.infer<typeof traditionSchema>

/** Person — referenspunkt, inte ingång (library.md, People and Authors). */
export const personSchema = z.object({
  id: idSchema,
  slug: slugSchema,
  namn: z.string().min(1),
  årtal: z.string().optional(),
  traditioner: z.array(idSchema).optional(),
  status: statusSchema,
  beskrivning: z.string().optional(),
})
export type Person = z.infer<typeof personSchema>

/** Hela den redaktionella innehållsmängden, som korsvalideringen arbetar på. */
export type Innehallsmangd = {
  rum: Rum[]
  teman: Tema[]
  frågor: Fraga[]
  vandringar: Vandring[]
  källor: Kalla[]
  passager: Kallpassage[]
  traditioner: Tradition[]
  personer: Person[]
}
