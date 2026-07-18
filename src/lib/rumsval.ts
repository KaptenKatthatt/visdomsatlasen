// Rumsvalet (roadmap fas 5, room-selection.md): ett temaval öppnar ett
// publicerat rum. Deterministiskt och genomskinligt — ingen viktning på
// beteende, ingen personalisering; bara redaktionellt standardrum, en
// godkänd mängd (publicerad + taggad med temat) och lokal historik som
// undviker omedelbar upprepning utan att förbjuda återläsning.
import type { Rum, Tema } from '../content/editorial/schema'

/** Hur många nyligen lästa rum som undviks; historiken är ingen aktivitetslogg. */
export const HISTORIKLANGD = 3

/** Urvalsmängden: publicerade rum som bär temat. Att ett rum är publicerat
 * och taggat med temat är godkännandet — utkast kan aldrig väljas. */
export const valbaraRum = (temaId: string, rum: Rum[]): Rum[] =>
  rum.filter((ettRum) => ettRum.status === 'publicerad' && ettRum.themes.includes(temaId))

// Lägre värde = mer nyligen läst; aldrig lästa rum hamnar längst bort.
const avstand = (id: string, senastLasta: string[]): number => {
  const index = senastLasta.indexOf(id)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

/** Väljer rummet för ett tema. Standardrummet först när det inte nyss
 * lästs; annars det alternativ som lästs längst sedan (aldrig lästa vinner,
 * lika avgörs av innehållsordningen). Är allt nyligen läst tillåts
 * upprepning — den är aldrig ett misslyckande. Null = lugnt tomläge. */
export const valjRum = (tema: Tema, rum: Rum[], senastLasta: string[]): Rum | null => {
  const mangd = valbaraRum(tema.id, rum)
  if (mangd.length === 0) return null
  // Ett enda fönster styr både "nyligen läst" och längst-sedan-ordningen,
  // så poster utanför fönstret aldrig påverkar valet. Urvalsregeln äger
  // fönstret; storens cap är bara lagringsstädning.
  const historik = senastLasta.slice(0, HISTORIKLANGD)
  const nyligen = new Set(historik)
  const standard = mangd.find((ettRum) => ettRum.id === tema.defaultRoom)
  if (standard && !nyligen.has(standard.id)) return standard
  const kandidater = mangd.filter((ettRum) => !nyligen.has(ettRum.id))
  const urval = kandidater.length > 0 ? kandidater : mangd
  return urval.reduce((basta, ettRum) =>
    avstand(ettRum.id, historik) > avstand(basta.id, historik) ? ettRum : basta,
  )
}
