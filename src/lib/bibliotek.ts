// Bibliotekets urval (roadmap fas 6, library.md): i bibliotekets listor får
// bara publicerat innehåll synas — striktare än tröskelns temafilter
// (!== 'arkiverad'), som visar utkastteman i väntan på deras första rum.
// Rätta inte "åt andra hållet": utkast nås enbart via direkt länk och är
// redaktionens granskningsvy, aldrig en del av utforskningen.
import type {
  Question,
  Source,
  SourcePassage,
  Room,
  Theme,
  Tradition,
  Path,
} from '../content/editorial/schema'

const publicerade = <T extends { status: Room['status'] }>(poster: T[]): T[] =>
  poster.filter((post) => post.status === 'publicerad')

const svOrdning =
  <T,>(text: (post: T) => string) =>
  (a: T, b: T): number =>
    text(a).localeCompare(text(b), 'sv')

const SIST = Number.MAX_SAFE_INTEGER

/** Slår upp id-referenser och behåller de publicerade posterna. */
export const publiceradeVia = <T extends { status: Room['status'] }>(
  ids: string[],
  hitta: (id: string) => T | undefined,
): T[] =>
  ids.flatMap((id) => {
    const post = hitta(id)
    return post !== undefined && post.status === 'publicerad' ? [post] : []
  })

/** Bibliotekets themes: publicerade, i samma redaktionella order som tröskeln. */
export const bibliotekTeman = (themes: Theme[]): Theme[] =>
  publicerade(themes).sort(
    (a, b) => (a.order ?? SIST) - (b.order ?? SIST) || svOrdning<Theme>((t) => t.label)(a, b),
  )

/** Den ändliga rumslistan: publicerade rum i svensk titelordning. */
export const bibliotekRum = (rum: Room[]): Room[] =>
  publicerade(rum).sort(svOrdning((r) => r.title))

/** Bibliotekets källposter: publicerade, i svensk titelordning. */
export const bibliotekKallor = (sources: Source[]): Source[] =>
  publicerade(sources).sort(svOrdning((k) => k.title))

/** Traditionerna: publicerade, i svensk namnordning. Sekundär ingång —
 * de hjälper till med sammanhang men äger inte frågorna (library.md). */
export const bibliotekTraditioner = (traditions: Tradition[]): Tradition[] =>
  publicerade(traditions).sort(svOrdning((t) => t.name))

/** Bibliotekets frågor: publicerade, i svensk textordning. */
export const bibliotekFragor = (frågor: Question[]): Question[] =>
  publicerade(frågor).sort(svOrdning((f) => f.text))

const svTitel = svOrdning<Room>((r) => r.title)

/** Frågesidans rum: rum som bär frågan som sitt eget anspråk (primaryQuestion)
 * står först; rum som bara pekar på den bland relatedQuestions breddar
 * efteråt. En ändlig lista — aldrig en sekvens. */
export const rumForFraga = (fragaId: string, rum: Room[]): Room[] => {
  const publicerat = publicerade(rum)
  const primära = publicerat.filter((ettRum) => ettRum.primaryQuestion === fragaId).sort(svTitel)
  const relaterade = publicerat
    .filter(
      (ettRum) =>
        ettRum.primaryQuestion !== fragaId && (ettRum.relatedQuestions ?? []).includes(fragaId),
    )
    .sort(svTitel)
  return [...primära, ...relaterade]
}

/** Temasidans frågor: publicerade frågor taggade med temat. */
export const fragorForTema = (temaId: string, frågor: Question[]): Question[] =>
  publicerade(frågor)
    .filter((fråga) => fråga.themes.includes(temaId))
    .sort(svOrdning((f) => f.text))

/** Frågans källmaterial: källorna bakom frågans rum — frågeschemat har inga
 * egna källreferenser, så materialet härleds ur rummens relationer. */
export const kallorForFraga = (fragaId: string, rum: Room[], sources: Source[]): Source[] => {
  const ids = new Set(
    rumForFraga(fragaId, rum).flatMap((ettRum) =>
      ettRum.sources.map((relation) => relation.source),
    ),
  )
  return bibliotekKallor(sources.filter((source) => ids.has(source.id)))
}

/** Bibliotekets vandringar: publicerade, i svensk titelordning (paths.md,
 * Discoverability — en stilla sektion, aldrig framhävd). */
export const bibliotekVandringar = (vandringar: Path[]): Path[] =>
  publicerade(vandringar).sort(svOrdning((v) => v.title))

/** Vandringens rum i redaktionell order — `rum`-listan ÄR sekvensen
 * (paths.md, Data Requirements), så inget sorteras om. Rummen behålls oavsett
 * status: valideringsgrinden ser till att en publicerad vandring bara rymmer
 * publicerade rum, och utkastvandringen är redaktionens granskningsvy där hela
 * följden ska gå att läsa. Saknade id (redaktionellt fel) hoppas tyst över. */
export const rumForVandring = (vandring: Path, rum: Room[]): Room[] =>
  vandring.rum.flatMap((id) => {
    const träff = rum.find((ettRum) => ettRum.id === id)
    return träff ? [träff] : []
  })

/** Ungefärlig sammanlagd lästid för vandringens rum (paths.md, Path Overview). */
export const vandringLastid = (rum: Room[]): number =>
  rum.reduce((summa, ettRum) => summa + ettRum.readingTimeMinutes, 0)

/** Vandringens traditions, stilla härledda ur rummens sources (paths.md,
 * source traditions shown quietly): rum → source → traditions, bara
 * publicerade, unika, i svensk namnordning. */
export const traditionerForVandring = (
  vandringensRum: Room[],
  sources: Source[],
  traditions: Tradition[],
): Tradition[] => {
  const källIds = new Set(
    vandringensRum.flatMap((ettRum) => ettRum.sources.map((relation) => relation.source)),
  )
  const traditionIds = new Set(
    sources
      .filter((source) => källIds.has(source.id))
      .flatMap((source) => source.traditions ?? []),
  )
  return bibliotekTraditioner(traditions.filter((tradition) => traditionIds.has(tradition.id)))
}

/** Källans publicerade passager, i naturlig referensordning (»avsnitt 5« före
 * »avsnitt 43«, inte tvärtom). Bara publicerade passager når biblioteket;
 * utkast är redaktionens granskningsvy. */
export const passagerForKalla = (kallaId: string, passager: SourcePassage[]): SourcePassage[] =>
  publicerade(passager)
    .filter((passage) => passage.source === kallaId)
    .sort((a, b) => a.reference.localeCompare(b.reference, 'sv', { numeric: true }))

/** Publicerade rum som använder källan — rum med primary relation först. */
export const rumForKalla = (kallaId: string, rum: Room[]): Room[] => {
  const primärvikt = (ettRum: Room): number =>
    ettRum.sources.some((relation) => relation.source === kallaId && relation.primary) ? 0 : 1
  return publicerade(rum)
    .filter((ettRum) => ettRum.sources.some((relation) => relation.source === kallaId))
    .sort((a, b) => primärvikt(a) - primärvikt(b) || svTitel(a, b))
}
