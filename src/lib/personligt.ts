// Personlig data (notes-and-saved.md): sparade platser och anteckningar.
// Ren logik utan React eller localStorage — migrering, sortering och etiketter
// bor här så store.tsx bara kopplar ihop och allt kan enhetstestas som rumsval.ts.
// Anteckningar är privata: de påverkar aldrig rumsvalet, publik sök, AI eller
// analytics (spec Privacy/AI Access).

/** En sparad post bär bara när den sparades. `null` = migrerad från gammal
 * boolean utan känt datum; datumet är valfritt i preview-kortet. */
export type SparadPost = { sparadNar: string | null }

/** Var en anteckning hör hemma. `amne` = kvarvarande topic-poster ur gamla
 * appen; utökas senare med `fraga`/`kalla` när de blir sparbara. */
export type Ursprung = 'rum' | 'vandring' | 'amne'

/** En anteckning kopplad till sitt ursprung. Nyckeln i store = ursprungId
 * (en anteckning per plats — dagens UX). ISO 8601-datum, läsbara i exporten. */
export type Anteckning = {
  ursprungTyp: Ursprung
  ursprungId: string
  text: string
  skapad: string
  uppdaterad: string
}

const ärRecord = (värde: unknown): värde is Record<string, unknown> =>
  typeof värde === 'object' && värde !== null && !Array.isArray(värde)

const ärUrsprung = (värde: unknown): värde is Ursprung =>
  värde === 'rum' || värde === 'vandring' || värde === 'amne'

// En sparad post ur okänd lagring: gammal `true` → migrerad utan datum, gammal
// `false` släpps, redan migrerad `{ sparadNar }` passerar orörd. Allt annat släpps.
const migreraSparadPost = (värde: unknown): SparadPost | null => {
  if (värde === true) return { sparadNar: null }
  if (ärRecord(värde)) {
    const sparadNar = värde.sparadNar
    if (sparadNar === null || typeof sparadNar === 'string') return { sparadNar }
  }
  return null
}

/** Migrerar ett sparat-record (rum eller vandringar) tyst och förlustfritt.
 * Idempotent: redan migrerad form går igenom oförändrad. Kastar aldrig. */
export const migreraSparade = (rått: unknown): Record<string, SparadPost> => {
  const ut: Record<string, SparadPost> = {}
  if (!ärRecord(rått)) return ut
  for (const [id, värde] of Object.entries(rått)) {
    const post = migreraSparadPost(värde)
    if (post) ut[id] = post
  }
  return ut
}

// En redan migrerad anteckning ur okänd lagring, defensivt narrowad. Fält som
// saknas eller är korrupta får trygga fallbacks — texten bevaras alltid.
const migreraAnteckningPost = (id: string, värde: unknown, nu: string): Anteckning | null => {
  if (!ärRecord(värde)) return null
  const { ursprungTyp, ursprungId, text, skapad, uppdaterad } = värde
  if (typeof text !== 'string' || text.trim().length === 0) return null
  return {
    ursprungTyp: ärUrsprung(ursprungTyp) ? ursprungTyp : 'amne',
    ursprungId: typeof ursprungId === 'string' ? ursprungId : id,
    text,
    skapad: typeof skapad === 'string' ? skapad : nu,
    uppdaterad: typeof uppdaterad === 'string' ? uppdaterad : nu,
  }
}

// Gamla `notes` (id→text) → ursprungskopplade poster; tomma prunas.
const posterUrGamlaNotes = (
  gamlaNotes: unknown,
  klassificera: (id: string) => Ursprung,
  nu: string,
): Record<string, Anteckning> => {
  const ut: Record<string, Anteckning> = {}
  if (!ärRecord(gamlaNotes)) return ut
  for (const [id, värde] of Object.entries(gamlaNotes)) {
    if (typeof värde !== 'string' || värde.trim().length === 0) continue
    ut[id] = { ursprungTyp: klassificera(id), ursprungId: id, text: värde, skapad: nu, uppdaterad: nu }
  }
  return ut
}

// Redan migrerade poster ur okänd lagring, defensivt narrowade.
const posterUrMigrerade = (nyaAnteckningar: unknown, nu: string): Record<string, Anteckning> => {
  const ut: Record<string, Anteckning> = {}
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
  klassificera: (id: string) => Ursprung,
  nu: string,
): Record<string, Anteckning> => ({
  ...posterUrGamlaNotes(gamlaNotes, klassificera, nu),
  ...posterUrMigrerade(nyaAnteckningar, nu),
})

/** Bygger anteckningens nya tillstånd vid en skrivning: `skapad` bevaras från
 * den befintliga posten (autospar utan synlig versionshistorik), `uppdaterad`
 * flyttas fram. */
export const uppdateradAnteckning = (
  befintlig: Anteckning | undefined,
  typ: Ursprung,
  id: string,
  text: string,
  nu: string,
): Anteckning => ({
  ursprungTyp: typ,
  ursprungId: id,
  text,
  skapad: befintlig?.skapad ?? nu,
  uppdaterad: nu,
})

/** Sparade poster i tidsordning: senast sparat först. Migrerade poster utan
 * datum (`sparadNar === null`) sorteras sist via tom nyckel. */
export const sparadeIdITidsordning = (poster: Record<string, SparadPost>): string[] => {
  const nyckel = (id: string): string => poster[id]?.sparadNar ?? ''
  return Object.keys(poster).sort((a, b) => nyckel(b).localeCompare(nyckel(a)))
}

/** Anteckningsöversiktens ordning: senast ändrad först, tomma utelämnade
 * (spec Notes Overview: lugnt kronologisk). ISO 8601 jämförs lexikalt. */
export const sorteradeAnteckningar = (anteckningar: Record<string, Anteckning>): Anteckning[] =>
  Object.values(anteckningar)
    .filter((anteckning) => anteckning.text.trim().length > 0)
    .sort((a, b) => b.uppdaterad.localeCompare(a.uppdaterad))

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
