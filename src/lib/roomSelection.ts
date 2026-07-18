// Rumsvalet (roadmap fas 5, room-selection.md): ett temaval öppnar ett
// publicerat rum. Deterministiskt och genomskinligt — ingen viktning på
// beteende, ingen personalisering; bara redaktionellt standardrum, en
// godkänd mängd (publicerad + taggad med temat) och lokal historik som
// undviker omedelbar upprepning utan att förbjuda återläsning.
import type { Room, Theme } from '../content/editorial/schema'

/** Hur många nyligen lästa rum som undviks; historiken är ingen aktivitetslogg. */
export const HISTORIKLANGD = 3

/** Urvalsmängden: publicerade rum som bär temat. Att ett rum är publicerat
 * och taggat med temat är godkännandet — utkast kan aldrig väljas. */
export const valbaraRoom = (themeId: string, rooms: Room[]): Room[] =>
  rooms.filter((room) => room.status === 'published' && room.themes.includes(themeId))

// Lägre värde = mer nyligen läst; aldrig lästa rum hamnar längst bort.
const avstand = (id: string, recentlyRead: string[]): number => {
  const index = recentlyRead.indexOf(id)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

/** Väljer rummet för ett tema. Standardrummet först när det inte nyss
 * lästs; annars det alternativ som lästs längst sedan (aldrig lästa vinner,
 * lika avgörs av innehållsordningen). Är allt nyligen läst tillåts
 * upprepning — den är aldrig ett misslyckande. Null = lugnt tomläge. */
export const selectRoom = (theme: Theme, rooms: Room[], recentlyRead: string[]): Room | null => {
  const set = valbaraRoom(theme.id, rooms)
  if (set.length === 0) return null
  // Ett enda fönster styr både "nyligen läst" och längst-sedan-ordningen,
  // så poster utanför fönstret aldrig påverkar valet. Urvalsregeln äger
  // fönstret; storens cap är bara lagringsstädning.
  const historik = recentlyRead.slice(0, HISTORIKLANGD)
  const nyligen = new Set(historik)
  const standard = set.find((room) => room.id === theme.defaultRoom)
  if (standard && !nyligen.has(standard.id)) return standard
  const kandidater = set.filter((room) => !nyligen.has(room.id))
  const selection = kandidater.length > 0 ? kandidater : set
  return selection.reduce((basta, room) =>
    avstand(room.id, historik) > avstand(basta.id, historik) ? room : basta,
  )
}
