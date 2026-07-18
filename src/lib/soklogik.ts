// Sökalgoritmen (search.md, Result Ranking): exakt/partiell matchning, svensk
// normalisering, kontrollerade synonymer och konservativ stavfelstolerans, vägt
// så att frågor och themes rankas rätt och en berömd author aldrig slår en
// mer relevant fråga. Ingen popularitets- eller beteendesignal existerar här.
import type { SearchDoc, SearchType } from './sokindex'
import { inomEttSkrivfel, normalisera, ordlista, soktokens, stam } from './soknormalisering'

/** Vilket fält en träff kom ur — internt, visas aldrig för användaren. */
export type HitLevel = 'title-exakt' | 'alias-exakt' | 'title' | 'keywords' | 'underrad' | 'text'

/** En träff. `poang`/`traffatFalt` är interna rankningsdetaljer. */
export type SearchResult = { dokument: SearchDoc; poang: number; traffatFalt: HitLevel }

/** Träffar av samma type, i relevansordning. */
export type SearchGroup = { type: SearchType; rubrik: string; traffar: SearchResult[] }

/** En grupp med det ändliga urval som visas + hur många som döljs bakom »Visa fler«. */
export type VisibleGroup = { grupp: SearchGroup; synliga: SearchResult[]; dolda: number }

export const MAX_SYNLIGA_PER_GRUPP = 5
export const MAX_SYNLIGA_TOTALT = 20
// Hårt tak per grupp även efter »Visa fler« — resultatet är alltid ändligt.
const MAX_PER_GRUPP = 20

// Nivåpoäng med gap större än största typbonus (12), så typordningen bara
// avgör inom samma nivå — exakt title slår alltid en partiell aliasträff.
const NIVAPOANG: Record<HitLevel, number> = {
  'title-exakt': 100,
  'alias-exakt': 85,
  'title': 60,
  'keywords': 44,
  'underrad': 28,
  'text': 12,
}

// Frågor och themes rankas före rum, vandringar, sources och traditions
// (search.md, Result Priority — den mänskliga frågan står först).
const TYPBONUS: Record<SearchType, number> = {
  fraga: 12,
  tema: 10,
  rum: 8,
  vandring: 6,
  kalla: 4,
  tradition: 2,
}

/** Svensk gruppetikett per söktyp — delas av resultatsektionerna och typfiltret. */
export const RUBRIK: Record<SearchType, string> = {
  fraga: 'Frågor',
  tema: 'Teman',
  rum: 'Rum',
  vandring: 'Vandringar',
  kalla: 'Källor',
  tradition: 'Traditioner',
}

const SYNONYM_FAKTOR = 0.7
const SKRIVFEL_FAKTOR = 0.5

// Kontrollerad synonymkarta (search.md, Synonyms): breddar recall utan att
// kollapsa viktiga skillnader. Redaktionellt underhållen; nyckeln är navet och
// kopplas dubbelriktat till var och en av sina synonymer.
const SYNONYMER: Record<string, string[]> = {
  oro: ['ångest', 'ängslan', 'bekymmer', 'rastlöshet'],
  lugn: ['stillhet', 'ro', 'sinnesro'],
  död: ['döden', 'dödlighet', 'livets slut'],
  mening: ['livsmening', 'syfte'],
  förlåtelse: ['förlåta', 'försoning'],
}

const koppla = (karta: Map<string, Set<string>>, a: string, b: string): void => {
  const grannar = karta.get(a) ?? new Set<string>()
  grannar.add(b)
  karta.set(a, grannar)
}

// Bygger en normaliserad, dubbelriktad synonymkarta: `oro` hittar `ångest` och
// `ångest` hittar `oro`. Nycklar och värden viks så matchningen är diakritokänslig.
const byggSynonymkarta = (rå: Record<string, string[]>): Map<string, Set<string>> => {
  const karta = new Map<string, Set<string>>()
  for (const [nyckel, värden] of Object.entries(rå)) {
    const n = normalisera(nyckel)
    for (const värde of värden) {
      const v = normalisera(värde)
      koppla(karta, n, v)
      koppla(karta, v, n)
    }
  }
  return karta
}

const SYNONYMKARTA = byggSynonymkarta(SYNONYMER)

const synonymerFor = (token: string): string[] => [...(SYNONYMKARTA.get(token) ?? [])]

// Matchfaktor mellan två normaliserade ord: 1 för exakt/prefix/stam/delsträng,
// nedvägt för skrivfel, 0 för ingen träff. Prefix och delsträng bara för längre
// tokens, skrivfel bara konservativt (se soknormalisering).
const bastaMotOrd = (token: string, ord: string): number => {
  if (token === ord) return 1
  if (token.length >= 3 && ord.startsWith(token)) return 1
  if (stam(token) === stam(ord)) return 1
  if (token.length >= 4 && ord.includes(token)) return 1
  if (inomEttSkrivfel(token, ord)) return SKRIVFEL_FAKTOR
  return 0
}

// Synonymer matchar konservativt — bara hela ord eller samma stam, aldrig
// godtyckliga prefix/delsträngar (så »ro« inte fastnar i »romersk«).
const synonymTraff = (synonym: string, ord: string): boolean =>
  synonym === ord || stam(synonym) === stam(ord)

// Bästa faktor för ett token mot en fältsamling ord, synonymer inräknade.
const faktorMotBucket = (token: string, ord: string[]): number => {
  let bäst = 0
  for (const o of ord) {
    const faktor = bastaMotOrd(token, o)
    if (faktor > bäst) bäst = faktor
  }
  if (bäst >= 1) return bäst
  const synonymer = synonymerFor(token)
  const träff = synonymer.some((synonym) => ord.some((o) => synonymTraff(synonym, o)))
  return träff ? Math.max(bäst, SYNONYM_FAKTOR) : bäst
}

type Bucket = { niva: HitLevel; bas: number; ord: string[] }

// De sökbara fälten som viktade ordsamlingar. Titel och alias delar den
// starkaste nivån — bägge är identifierande.
const dokumentBuckets = (dok: SearchDoc): Bucket[] => [
  {
    niva: 'title',
    bas: NIVAPOANG.title,
    ord: [...ordlista(dok.title), ...dok.alias.flatMap(ordlista)],
  },
  { niva: 'keywords', bas: NIVAPOANG.keywords, ord: dok.keywords.flatMap(ordlista) },
  { niva: 'underrad', bas: NIVAPOANG.underrad, ord: dok.underrad ? ordlista(dok.underrad) : [] },
  { niva: 'text', bas: NIVAPOANG.text, ord: dok.text.flatMap(ordlista) },
]

// Ett tokens bästa poäng och nivå över dokumentets fält.
const tokenBästa = (token: string, buckets: Bucket[]): { poang: number; niva: HitLevel } => {
  let poang = 0
  let niva: HitLevel = 'text'
  for (const bucket of buckets) {
    const p = bucket.bas * faktorMotBucket(token, bucket.ord)
    if (p > poang) {
      poang = p
      niva = bucket.niva
    }
  }
  return { poang, niva }
}

// Exakt helfrågsträff (interpunktion och diakriter bortnormaliserade).
const exaktNiva = (nyckelfrågan: string, dok: SearchDoc): HitLevel | undefined => {
  if (ordlista(dok.title).join(' ') === nyckelfrågan) return 'title-exakt'
  if (dok.alias.some((alias) => ordlista(alias).join(' ') === nyckelfrågan)) return 'alias-exakt'
  return undefined
}

// En dokumentträff eller inget. Alla tokens måste träffa (AND) — söket hittar
// det man menar utan att bredda med löst besläktade resultat.
const matchaDokument = (
  nyckelfrågan: string,
  tokens: string[],
  dok: SearchDoc,
): SearchResult | undefined => {
  const exakt = exaktNiva(nyckelfrågan, dok)
  if (exakt) return { dokument: dok, poang: NIVAPOANG[exakt] + TYPBONUS[dok.type], traffatFalt: exakt }
  if (tokens.length === 0) return undefined
  const buckets = dokumentBuckets(dok)
  const perToken = tokens.map((token) => tokenBästa(token, buckets))
  if (perToken.some((pt) => pt.poang <= 0)) return undefined
  const medel = perToken.reduce((summa, pt) => summa + pt.poang, 0) / perToken.length
  const bäst = perToken.reduce((b, pt) => (pt.poang > b.poang ? pt : b))
  return { dokument: dok, poang: medel + TYPBONUS[dok.type], traffatFalt: bäst.niva }
}

const svTitel = (a: SearchResult, b: SearchResult): number =>
  a.dokument.title.localeCompare(b.dokument.title, 'sv')

const bästaPoang = (grupp: SearchGroup): number => grupp.traffar[0]?.poang ?? 0

// Grupperar träffar per type; inom gruppen på poäng och sedan svensk titelordning;
// grupperna efter bästa träff, så den mest relevanta gruppen står först.
const grupperaTraffar = (träffar: SearchResult[]): SearchGroup[] => {
  const karta = new Map<SearchType, SearchResult[]>()
  for (const träff of träffar) {
    const lista = karta.get(träff.dokument.type) ?? []
    lista.push(träff)
    karta.set(träff.dokument.type, lista)
  }
  const grupper = [...karta.entries()].map(([type, lista]): SearchGroup => ({
    type,
    rubrik: RUBRIK[type],
    traffar: lista.sort((a, b) => b.poang - a.poang || svTitel(a, b)).slice(0, MAX_PER_GRUPP),
  }))
  return grupper.sort((a, b) => bästaPoang(b) - bästaPoang(a))
}

/** Hela sökningen: en fråga kortare än två tecken ger inget. Grupperna kommer i
 * relevansordning; varje grupp är ändlig (aldrig oändlig scroll). */
export const sokIBiblioteket = (fraga: string, index: SearchDoc[]): SearchGroup[] => {
  const nyckelfrågan = ordlista(fraga).join(' ')
  if (nyckelfrågan.length < 2) return []
  const tokens = soktokens(fraga)
  const träffar = index.flatMap((dok) => {
    const träff = matchaDokument(nyckelfrågan, tokens, dok)
    return träff ? [träff] : []
  })
  return grupperaTraffar(träffar)
}

/** Den ändliga initialvyn: som mest fem per grupp och tjugo totalt; en expanderad
 * grupp visar hela sin (hårt begränsade) lista. »Visa fler« röjer resten. */
export const synligaTraffar = (
  grupper: SearchGroup[],
  expanderade: ReadonlySet<SearchType>,
): VisibleGroup[] => {
  let kvar = MAX_SYNLIGA_TOTALT
  return grupper.map((grupp) => {
    const expanderad = expanderade.has(grupp.type)
    const gräns = expanderad ? MAX_PER_GRUPP : Math.min(MAX_SYNLIGA_PER_GRUPP, Math.max(kvar, 0))
    const synliga = grupp.traffar.slice(0, gräns)
    if (!expanderad) kvar -= synliga.length
    return { grupp, synliga, dolda: grupp.traffar.length - synliga.length }
  })
}
