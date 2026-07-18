// Det publika sökindexet (search.md, Indexing): ett genererat dokument per
// publicerad post. Byggs UTESLUTANDE via bibliotek.ts-urvalen och slår bara upp
// referenser bland publicerade poster, så utkast och intern metadata aldrig kan
// nå ett sökbart fält. Privata anteckningar hör inte hemma här — de har en helt
// egen väg (sokanteckningar.ts).
import type {
  Fraga,
  Innehallsmangd,
  Kalla,
  Kallpassage,
  Rum,
  Tema,
  Tradition,
  Vandring,
} from '../content/redaktion/schema'
import {
  bibliotekFragor,
  bibliotekKallor,
  bibliotekRum,
  bibliotekTeman,
  bibliotekTraditioner,
  bibliotekVandringar,
  passagerForKalla,
  rumForVandring,
  vandringLastid,
} from './bibliotek'
import {
  allaFragor,
  allaKallor,
  allaPassager,
  allaRum,
  allaTeman,
  allaTraditioner,
  allaVandringar,
  kallnamn,
} from './innehall'
import { utdrag } from './personligt'
import { SOKTYPER, type Soktyp, type SökParametrar } from './soktyper'

// Söktyperna bor i soktyper.ts (utan innehållsberoenden) så routern kan
// validera URL:en utan att dra in indexbygget; här återexporteras de så
// befintliga importvägar (soklogik, sidor) fortsatt kan gå via sokindex.
export { SOKTYPER, type Soktyp, type SökParametrar }

/** Sökmål = de To-varianter söket kan öppna (redaktionella sidor). Egen union,
 * strukturellt kompatibel med To, så sökindexet inte kopplas till legacy-eran i
 * model.ts. Traditioner saknar egen sida → olänkade rader, därav valfritt `mal`. */
export type Sokmal =
  | { kind: 'fraga'; slug: string }
  | { kind: 'tema'; slug: string }
  | { kind: 'rum'; slug: string }
  | { kind: 'kallpost'; slug: string }
  | { kind: 'vandring'; slug: string }

/** Ett sökdokument. `titel`/`underrad`/`meta` visas oviket (korrekt stavning);
 * `alias`/`nyckelord`/`text` är sökbara fält med fallande vikt. `poang` finns
 * aldrig här — rankningen lever i soklogik.ts. */
export type Sokdokument = {
  typ: Soktyp
  id: string
  titel: string
  underrad?: string
  meta?: string
  mal?: Sokmal
  alias: string[]
  nyckelord: string[]
  text: string[]
}

const kartaViaId = <T extends { id: string }>(poster: T[]): Map<string, T> =>
  new Map(poster.map((post) => [post.id, post]))

const dokumentUrFraga = (fraga: Fraga): Sokdokument => ({
  typ: 'fraga',
  id: fraga.id,
  titel: fraga.text,
  underrad: fraga.beskrivning ? utdrag(fraga.beskrivning, 110) : undefined,
  mal: { kind: 'fraga', slug: fraga.slug },
  alias: [],
  nyckelord: fraga.nyckelord ?? [],
  text: fraga.beskrivning ? [fraga.beskrivning] : [],
})

const dokumentUrTema = (tema: Tema): Sokdokument => ({
  typ: 'tema',
  id: tema.id,
  titel: tema.etikett,
  underrad: tema.beskrivning,
  mal: { kind: 'tema', slug: tema.slug },
  alias: [],
  nyckelord: tema.nyckelord ?? [],
  text: tema.beskrivning ? [tema.beskrivning] : [],
})

const temaEtiketter = (rum: Rum, teman: Map<string, Tema>): string[] =>
  rum.teman.flatMap((id) => {
    const tema = teman.get(id)
    return tema ? [tema.etikett] : []
  })

const kallnamnFor = (rum: Rum, källor: Map<string, Kalla>): string[] =>
  rum.källor.flatMap((relation) => {
    const källa = källor.get(relation.källa)
    return källa ? [kallnamn(källa)] : []
  })

const rumMeta = (rum: Rum, fråga: Fraga | undefined): string => {
  const lästid = `ca ${rum.lästidMinuter} min`
  return fråga ? `${fråga.text} · ${lästid}` : lästid
}

const dokumentUrRum = (
  rum: Rum,
  frågor: Map<string, Fraga>,
  teman: Map<string, Tema>,
  källor: Map<string, Kalla>,
): Sokdokument => {
  const fråga = frågor.get(rum.primärFråga)
  return {
    typ: 'rum',
    id: rum.id,
    titel: rum.titel,
    underrad: rum.sammanfattning,
    meta: rumMeta(rum, fråga),
    mal: { kind: 'rum', slug: rum.slug },
    alias: [],
    nyckelord: rum.taggar ?? [],
    text: [
      rum.tankeAttBära,
      ...rum.reflektionsfrågor,
      ...(fråga ? [fråga.text] : []),
      ...temaEtiketter(rum, teman),
      ...kallnamnFor(rum, källor),
    ],
  }
}

const vandringMeta = (rummen: Rum[]): string => {
  const antal = rummen.length === 1 ? 'Ett rum' : `${rummen.length} rum`
  return `${antal} · ca ${vandringLastid(rummen)} min`
}

const dokumentUrVandring = (
  vandring: Vandring,
  frågor: Map<string, Fraga>,
  rummen: Rum[],
): Sokdokument => {
  const central = frågor.get(vandring.centralFråga)
  return {
    typ: 'vandring',
    id: vandring.id,
    titel: vandring.titel,
    underrad: utdrag(vandring.introduktion, 110),
    meta: vandringMeta(rummen),
    mal: { kind: 'vandring', slug: vandring.slug },
    alias: [],
    nyckelord: vandring.nyckelord ?? [],
    text: [vandring.introduktion, ...(central ? [central.text] : [])],
  }
}

const kallaAlias = (källa: Kalla): string[] => [
  ...(källa.originaltitel ? [källa.originaltitel] : []),
  ...(källa.alias ?? []),
  ...(källa.författare ? [källa.författare] : []),
  ...(källa.tillskrivenFörfattare ? [källa.tillskrivenFörfattare] : []),
]

const traditionsnamn = (källa: Kalla, traditioner: Map<string, Tradition>): string[] =>
  (källa.traditioner ?? []).flatMap((id) => {
    const tradition = traditioner.get(id)
    return tradition ? [tradition.namn] : []
  })

const passagetext = (passager: Kallpassage[]): string[] =>
  passager.flatMap((passage) => [
    passage.referens,
    ...(passage.översättning ? [passage.översättning] : []),
  ])

const dokumentUrKalla = (
  källa: Kalla,
  traditioner: Map<string, Tradition>,
  passager: Kallpassage[],
): Sokdokument => ({
  typ: 'kalla',
  id: källa.id,
  titel: källa.titel,
  underrad: kallnamn(källa),
  meta: källa.ungefärligDatering,
  mal: { kind: 'kallpost', slug: källa.slug },
  alias: kallaAlias(källa),
  nyckelord: källa.nyckelord ?? [],
  text: [
    ...(källa.beskrivning ? [källa.beskrivning] : []),
    ...traditionsnamn(källa, traditioner),
    ...passagetext(passager),
  ],
})

const dokumentUrTradition = (tradition: Tradition): Sokdokument => ({
  typ: 'tradition',
  id: tradition.id,
  titel: tradition.namn,
  underrad: tradition.beskrivning,
  mal: undefined,
  alias: [],
  nyckelord: tradition.nyckelord ?? [],
  text: tradition.beskrivning ? [tradition.beskrivning] : [],
})

type Innehall = Pick<
  Innehallsmangd,
  'rum' | 'teman' | 'frågor' | 'vandringar' | 'källor' | 'passager' | 'traditioner'
>

/** Bygger det publika indexet. Uppslagskartorna byggs ur de PUBLICERADE
 * urvalen, så ingen utkasttext kan följa med in i ett sökbart fält ens via en
 * referens. */
export const byggSokindex = (innehall: Innehall): Sokdokument[] => {
  const frågor = kartaViaId(bibliotekFragor(innehall.frågor))
  const teman = kartaViaId(bibliotekTeman(innehall.teman))
  const källor = kartaViaId(bibliotekKallor(innehall.källor))
  const traditioner = kartaViaId(bibliotekTraditioner(innehall.traditioner))
  return [
    ...bibliotekFragor(innehall.frågor).map(dokumentUrFraga),
    ...bibliotekTeman(innehall.teman).map(dokumentUrTema),
    ...bibliotekRum(innehall.rum).map((rum) => dokumentUrRum(rum, frågor, teman, källor)),
    ...bibliotekVandringar(innehall.vandringar).map((vandring) =>
      dokumentUrVandring(vandring, frågor, rumForVandring(vandring, innehall.rum)),
    ),
    ...bibliotekKallor(innehall.källor).map((källa) =>
      dokumentUrKalla(källa, traditioner, passagerForKalla(källa.id, innehall.passager)),
    ),
    ...bibliotekTraditioner(innehall.traditioner).map(dokumentUrTradition),
  ]
}

/** Appens index, byggt en gång vid moduladdning ur allt laddat innehåll. */
export const sokindexet: Sokdokument[] = byggSokindex({
  rum: allaRum,
  teman: allaTeman,
  frågor: allaFragor,
  vandringar: allaVandringar,
  källor: allaKallor,
  passager: allaPassager,
  traditioner: allaTraditioner,
})
