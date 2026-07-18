// Personlig data (notes-and-saved.md): sparade platser och anteckningar.
// Ren logik utan React eller localStorage — migrering, sortering och etiketter
// bor här så store.tsx bara kopplar ihop och allt kan enhetstestas som rumsval.ts.
// Anteckningar är privata: de påverkar aldrig rumsvalet, publik sök, AI eller
// analytics (spec Privacy/AI Access).

/** Ett kapitelbokmärke i verkläsaren: pekar på ett kapitel och bär boknamnet
 * så Sparat kan rendera raden utan ett extra API-anrop. */
export type ChapterBookmark = {
  workId: string
  bookSlug: string
  chapter: number
  bookName: string
  savedAt: number
}

/** Nyckel för ett kapitelbokmärke — samma form som bok-id:t plus kapitel. */
export const chapterKey = (workId: string, bookSlug: string, chapter: number): string =>
  `${workId}/${bookSlug}:${chapter}`

/** En sparad post bär bara när den sparades. `null` = migrerad från gammal
 * boolean utan känt datum; datumet är valfritt i preview-kortet. */
export type SavedItem = { sparadNar: string | null }

/** Var en anteckning hör hemma. `amne` = kvarvarande topic-poster ur gamla
 * appen; utökas senare med `fraga`/`kalla` när de blir sparbara. */
export type Origin = 'rum' | 'vandring' | 'amne'

/** En anteckning kopplad till sitt ursprung. Nyckeln i store = ursprungId
 * (en anteckning per place — dagens UX). ISO 8601-datum, läsbara i exporten. */
export type Note = {
  ursprungTyp: Origin
  ursprungId: string
  text: string
  created: string
  updated: string
}

const ärRecord = (värde: unknown): värde is Record<string, unknown> =>
  typeof värde === 'object' && värde !== null && !Array.isArray(värde)

const ärUrsprung = (värde: unknown): värde is Origin =>
  värde === 'rum' || värde === 'vandring' || värde === 'amne'

// En sparad post ur okänd lagring: gammal `true` → migrerad utan datum, gammal
// `false` släpps, redan migrerad `{ sparadNar }` passerar orörd. Allt annat släpps.
const migreraSparadPost = (värde: unknown): SavedItem | null => {
  if (värde === true) return { sparadNar: null }
  if (ärRecord(värde)) {
    const sparadNar = värde.sparadNar
    if (sparadNar === null || typeof sparadNar === 'string') return { sparadNar }
  }
  return null
}

/** Migrerar ett sparat-record (rum eller vandringar) tyst och förlustfritt.
 * Idempotent: redan migrerad form går igenom oförändrad. Kastar aldrig. */
export const migreraSparade = (rått: unknown): Record<string, SavedItem> => {
  const ut: Record<string, SavedItem> = {}
  if (!ärRecord(rått)) return ut
  for (const [id, värde] of Object.entries(rått)) {
    const post = migreraSparadPost(värde)
    if (post) ut[id] = post
  }
  return ut
}

// En redan migrerad anteckning ur okänd lagring, defensivt narrowad. Fält som
// saknas eller är korrupta får trygga fallbacks — texten bevaras alltid.
const migreraAnteckningPost = (id: string, värde: unknown, nu: string): Note | null => {
  if (!ärRecord(värde)) return null
  const { ursprungTyp, ursprungId, text, created, updated } = värde
  if (typeof text !== 'string' || text.trim().length === 0) return null
  return {
    ursprungTyp: ärUrsprung(ursprungTyp) ? ursprungTyp : 'amne',
    ursprungId: typeof ursprungId === 'string' ? ursprungId : id,
    text,
    created: typeof created === 'string' ? created : nu,
    updated: typeof updated === 'string' ? updated : nu,
  }
}

// Gamla `notes` (id→text) → ursprungskopplade poster; tomma prunas.
const posterUrGamlaNotes = (
  gamlaNotes: unknown,
  klassificera: (id: string) => Origin,
  nu: string,
): Record<string, Note> => {
  const ut: Record<string, Note> = {}
  if (!ärRecord(gamlaNotes)) return ut
  for (const [id, värde] of Object.entries(gamlaNotes)) {
    if (typeof värde !== 'string' || värde.trim().length === 0) continue
    ut[id] = { ursprungTyp: klassificera(id), ursprungId: id, text: värde, created: nu, updated: nu }
  }
  return ut
}

// Redan migrerade poster ur okänd lagring, defensivt narrowade.
const posterUrMigrerade = (nyaAnteckningar: unknown, nu: string): Record<string, Note> => {
  const ut: Record<string, Note> = {}
  if (!ärRecord(nyaAnteckningar)) return ut
  for (const [id, värde] of Object.entries(nyaAnteckningar)) {
    const post = migreraAnteckningPost(id, värde, nu)
    if (post) ut[id] = post
  }
  return ut
}

/** Migrerar anteckningar tyst och förlustfritt: gamla `notes` (id→text) blir
 * ursprungskopplade poster via `klassificera`, redan migrerade poster vinner
 * (spridningsordningen). Tomma anteckningar prunas. Kastar aldrig — privat data
 * får aldrig gå förlorad vid en uppgradering. */
export const migreraAnteckningar = (
  gamlaNotes: unknown,
  nyaAnteckningar: unknown,
  klassificera: (id: string) => Origin,
  nu: string,
): Record<string, Note> => ({
  ...posterUrGamlaNotes(gamlaNotes, klassificera, nu),
  ...posterUrMigrerade(nyaAnteckningar, nu),
})

/** Bygger anteckningens nya tillstånd vid en skrivning: `created` bevaras från
 * den befintliga posten (autospar utan synlig versionshistorik), `updated`
 * flyttas fram. */
export const uppdateradAnteckning = (
  befintlig: Note | undefined,
  type: Origin,
  id: string,
  text: string,
  nu: string,
): Note => ({
  ursprungTyp: type,
  ursprungId: id,
  text,
  created: befintlig?.created ?? nu,
  updated: nu,
})

/** Sparade poster i tidsordning: senast sparat först. Migrerade poster utan
 * datum (`sparadNar === null`) sorteras sist via tom nyckel. */
export const sparadeIdITidsordning = (poster: Record<string, SavedItem>): string[] => {
  const nyckel = (id: string): string => poster[id]?.sparadNar ?? ''
  return Object.keys(poster).sort((a, b) => nyckel(b).localeCompare(nyckel(a)))
}

/** Anteckningsöversiktens order: senast ändrad först, tomma utelämnade
 * (spec Notes Overview: lugnt kronologisk). ISO 8601 jämförs lexikalt. */
export const sorteradeAnteckningar = (anteckningar: Record<string, Note>): Note[] =>
  Object.values(anteckningar)
    .filter((anteckning) => anteckning.text.trim().length > 0)
    .sort((a, b) => b.updated.localeCompare(a.updated))

/** Kort utdrag för preview-kort; klipper generöst och osynligt (spec Note Length). */
export const utdrag = (text: string, max = 72): string => {
  const rensad = text.trim()
  return rensad.length > max ? `${rensad.slice(0, max)}…` : rensad
}

/** Stilla svenskt datum för »sparad«-raden, eller inget vid okänt/ogiltigt datum. */
export const datumEtikett = (iso: string | null): string | undefined => {
  if (!iso) return undefined
  const tid = new Date(iso)
  if (Number.isNaN(tid.getTime())) return undefined
  return new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' }).format(tid)
}
