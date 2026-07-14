// Svensk textnormalisering för sök (search.md, Swedish Language Support).
// Ren logik utan beroenden. All vikning här gäller MATCHNING — aldrig visning;
// korrekt stavning bevaras alltid i det som renderas (search.md, samma avsnitt).

/** Viker text för matchning: trim, gemener och diakritvikning (å/ä→a, ö→o, é→e).
 * Så hittar `forlatelse` innehåll om `förlåtelse` — en bekvämlighet, inte en
 * ersättning för korrekt språk. */
export const normalisera = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

/** Normaliserade ord ur en text; delar på allt som inte är bokstav/siffra. */
export const ordlista = (text: string): string[] =>
  normalisera(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((ord) => ord.length > 0)

// Vanliga svenska funktionsord (normaliserad form) som bär lite sökintention.
// En fråga som bara består av stopord ger inga träffar (search.md, Query Behaviour).
const STOPORD = new Set([
  'och', 'att', 'som', 'det', 'en', 'ett', 'den', 'de', 'är', 'ar', 'var', 'med',
  'om', 'av', 'på', 'pa', 'för', 'for', 'till', 'i', 'du', 'jag', 'man', 'hur',
  'vad', 'när', 'nar', 'vem', 'varför', 'varfor', 'något', 'nagot', 'kan', 'ska',
])

/** Sökfrågans meningsbärande tokens: normaliserade ord minus stopord. */
export const soktokens = (fraga: string): string[] =>
  ordlista(fraga).filter((ord) => !STOPORD.has(ord))

// Vanliga svenska böjningssuffix, längst först så -orna klipps före -or före -a.
const SUFFIX = ['orna', 'arna', 'erna', 'or', 'ar', 'er', 'en', 'et', 'na', 'a', 's']

/** Konservativ svensk stam: klipper ett vanligt böjningssuffix när minst tre
 * tecken återstår, så `fråga`/`frågor` matchar utan att korta ord kollapsar. */
export const stam = (ord: string): string => {
  for (const suffix of SUFFIX) {
    if (ord.length - suffix.length >= 3 && ord.endsWith(suffix)) {
      return ord.slice(0, ord.length - suffix.length)
    }
  }
  return ord
}

// Exakt ett teckenbyte på samma position (två lika långa ord).
const skiljerPaEttTecken = (a: string, b: string): boolean => {
  let skillnader = 0
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) skillnader += 1
    if (skillnader > 1) return false
  }
  return skillnader === 1
}

// Exakt en omkastning av två intilliggande tecken (två lika långa ord).
const ärTransposition = (a: string, b: string): boolean => {
  let första = -1
  let andra = -1
  let antal = 0
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === b[i]) continue
    antal += 1
    if (antal === 1) första = i
    else if (antal === 2) andra = i
    else return false
  }
  return (
    antal === 2 &&
    andra === första + 1 &&
    a[första] === b[andra] &&
    a[andra] === b[första]
  )
}

// `lang` blir `kort` genom att ta bort exakt ett tecken (längdskillnad 1).
const ärEnInsättning = (kort: string, lang: string): boolean => {
  let i = 0
  let hopp = 0
  for (let j = 0; j < lang.length; j += 1) {
    if (i < kort.length && kort[i] === lang[j]) i += 1
    else hopp += 1
    if (hopp > 1) return false
  }
  return i === kort.length
}

/** Konservativ stavfelstolerans (search.md, Typo Tolerance): sann när orden
 * skiljer sig på högst ett skrivfel (byte, omkastning, in-/utskott) och båda är
 * minst fem tecken — annars kan ett enda fel byta ordets mening. Lika ord är
 * ingen felträff (de fångas som exakt match tidigare i kedjan). */
export const inomEttSkrivfel = (a: string, b: string): boolean => {
  if (a.length < 5 || b.length < 5) return false
  const diff = a.length - b.length
  if (diff === 0) return skiljerPaEttTecken(a, b) || ärTransposition(a, b)
  if (diff === 1) return ärEnInsättning(b, a)
  if (diff === -1) return ärEnInsättning(a, b)
  return false
}
