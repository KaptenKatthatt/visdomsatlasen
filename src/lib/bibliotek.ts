// Bibliotekets urval (roadmap fas 6, library.md): i bibliotekets listor får
// bara publicerat innehåll synas — striktare än tröskelns temafilter
// (!== 'arkiverad'), som visar utkastteman i väntan på deras första rum.
// Rätta inte "åt andra hållet": utkast nås enbart via direkt länk och är
// redaktionens granskningsvy, aldrig en del av utforskningen.
import type { Rum, Tema } from '../content/redaktion/schema'

const publicerade = <T extends { status: Rum['status'] }>(poster: T[]): T[] =>
  poster.filter((post) => post.status === 'publicerad')

const SIST = Number.MAX_SAFE_INTEGER

/** Bibliotekets teman: publicerade, i samma redaktionella ordning som tröskeln. */
export const bibliotekTeman = (teman: Tema[]): Tema[] =>
  publicerade(teman).sort(
    (a, b) =>
      (a.ordning ?? SIST) - (b.ordning ?? SIST) || a.etikett.localeCompare(b.etikett, 'sv'),
  )

/** Den ändliga rumslistan: publicerade rum i svensk titelordning. */
export const bibliotekRum = (rum: Rum[]): Rum[] =>
  publicerade(rum).sort((a, b) => a.titel.localeCompare(b.titel, 'sv'))
