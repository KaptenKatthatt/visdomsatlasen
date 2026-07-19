// Room selection (roadmap phase 5, room-selection.md): picking a theme opens a
// published room. Deterministic and transparent — no weighting on
// behaviour, no personalisation; just the editorial default room, an
// approved set (published + tagged with the theme) and local history that
// avoids immediate repetition without forbidding rereading.
import type { Room, Theme } from '../content/editorial/schema'

/** How many recently read rooms are avoided; the history is not an activity log. */
export const HISTORY_LENGTH = 3

/** The candidate set: published rooms carrying the theme. A room being published
 * and tagged with the theme is the approval — drafts can never be selected. */
export const valbaraRoom = (themeId: string, rooms: Room[]): Room[] =>
  rooms.filter((room) => room.status === 'published' && room.themes.includes(themeId))

// Lower value = more recently read; never-read rooms land farthest away.
const avstand = (id: string, recentlyRead: string[]): number => {
  const index = recentlyRead.indexOf(id)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

/** Selects the room for a theme. The default room first when it wasn't just
 * read; otherwise the option read longest ago (never-read wins, ties settled
 * by content order). If everything was read recently, repetition is
 * allowed — it is never a failure. Null = calm empty state. */
export const selectRoom = (theme: Theme, rooms: Room[], recentlyRead: string[]): Room | null => {
  const set = valbaraRoom(theme.id, rooms)
  if (set.length === 0) return null
  // A single window drives both "recently read" and the longest-ago ordering,
  // so entries outside the window never affect the selection. The selection rule
  // owns the window; the store's cap is only storage cleanup.
  const historik = recentlyRead.slice(0, HISTORY_LENGTH)
  const nyligen = new Set(historik)
  const standard = set.find((room) => room.id === theme.defaultRoom)
  if (standard && !nyligen.has(standard.id)) return standard
  const kandidater = set.filter((room) => !nyligen.has(room.id))
  const selection = kandidater.length > 0 ? kandidater : set
  return selection.reduce((basta, room) =>
    avstand(room.id, historik) > avstand(basta.id, historik) ? room : basta,
  )
}
