// Bibliotekets urval (roadmap fas 6, library.md): i bibliotekets listor får
// bara publicerat innehåll synas — striktare än tröskelns temafilter
// (!== 'arkiverad'), som visar utkastteman i väntan på deras första rum.
// Rätta inte "åt andra hållet": utkast nås enbart via direkt länk och är
// redaktionens granskningsvy, aldrig en del av utforskningen.
import type { Fraga, Kalla, Rum, Tema, Tradition } from '../content/redaktion/schema'

const publicerade = <T extends { status: Rum['status'] }>(poster: T[]): T[] =>
  poster.filter((post) => post.status === 'publicerad')

const svOrdning =
  <T,>(text: (post: T) => string) =>
  (a: T, b: T): number =>
    text(a).localeCompare(text(b), 'sv')

const SIST = Number.MAX_SAFE_INTEGER

/** Slår upp id-referenser och behåller de publicerade posterna. */
export const publiceradeVia = <T extends { status: Rum['status'] }>(
  ids: string[],
  hitta: (id: string) => T | undefined,
): T[] =>
  ids.flatMap((id) => {
    const post = hitta(id)
    return post !== undefined && post.status === 'publicerad' ? [post] : []
  })

/** Bibliotekets teman: publicerade, i samma redaktionella ordning som tröskeln. */
export const bibliotekTeman = (teman: Tema[]): Tema[] =>
  publicerade(teman).sort(
    (a, b) => (a.ordning ?? SIST) - (b.ordning ?? SIST) || svOrdning<Tema>((t) => t.etikett)(a, b),
  )

/** Den ändliga rumslistan: publicerade rum i svensk titelordning. */
export const bibliotekRum = (rum: Rum[]): Rum[] =>
  publicerade(rum).sort(svOrdning((r) => r.titel))

/** Bibliotekets källposter: publicerade, i svensk titelordning. */
export const bibliotekKallor = (källor: Kalla[]): Kalla[] =>
  publicerade(källor).sort(svOrdning((k) => k.titel))

/** Traditionerna: publicerade, i svensk namnordning. Sekundär ingång —
 * de hjälper till med sammanhang men äger inte frågorna (library.md). */
export const bibliotekTraditioner = (traditioner: Tradition[]): Tradition[] =>
  publicerade(traditioner).sort(svOrdning((t) => t.namn))

/** Bibliotekets frågor: publicerade, i svensk textordning. */
export const bibliotekFragor = (frågor: Fraga[]): Fraga[] =>
  publicerade(frågor).sort(svOrdning((f) => f.text))

const svTitel = svOrdning<Rum>((r) => r.titel)

/** Frågesidans rum: rum som bär frågan som sitt eget anspråk (primärFråga)
 * står först; rum som bara pekar på den bland relateradeFrågor breddar
 * efteråt. En ändlig lista — aldrig en sekvens. */
export const rumForFraga = (fragaId: string, rum: Rum[]): Rum[] => {
  const publicerat = publicerade(rum)
  const primära = publicerat.filter((ettRum) => ettRum.primärFråga === fragaId).sort(svTitel)
  const relaterade = publicerat
    .filter(
      (ettRum) =>
        ettRum.primärFråga !== fragaId && (ettRum.relateradeFrågor ?? []).includes(fragaId),
    )
    .sort(svTitel)
  return [...primära, ...relaterade]
}

/** Temasidans frågor: publicerade frågor taggade med temat. */
export const fragorForTema = (temaId: string, frågor: Fraga[]): Fraga[] =>
  publicerade(frågor)
    .filter((fråga) => fråga.teman.includes(temaId))
    .sort(svOrdning((f) => f.text))

/** Frågans källmaterial: källorna bakom frågans rum — frågeschemat har inga
 * egna källreferenser, så materialet härleds ur rummens relationer. */
export const kallorForFraga = (fragaId: string, rum: Rum[], källor: Kalla[]): Kalla[] => {
  const ids = new Set(
    rumForFraga(fragaId, rum).flatMap((ettRum) =>
      ettRum.källor.map((relation) => relation.källa),
    ),
  )
  return bibliotekKallor(källor.filter((källa) => ids.has(källa.id)))
}

/** Publicerade rum som använder källan — rum med primär relation först. */
export const rumForKalla = (kallaId: string, rum: Rum[]): Rum[] => {
  const primärvikt = (ettRum: Rum): number =>
    ettRum.källor.some((relation) => relation.källa === kallaId && relation.primär) ? 0 : 1
  return publicerade(rum)
    .filter((ettRum) => ettRum.källor.some((relation) => relation.källa === kallaId))
    .sort((a, b) => primärvikt(a) - primärvikt(b) || svTitel(a, b))
}
