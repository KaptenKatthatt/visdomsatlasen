import { RowLink } from '../components/RowLink'
import { RumRad } from '../components/RumRad'
import type { Rum, Vandring } from '../content/editorial/schema'
import { findTopic } from '../content/topics'
import { hittaRumViaId, hittaVandringViaId } from '../lib/innehall'
import {
  chapterKey,
  sorteradeAnteckningar,
  sparadeIdITidsordning,
  type ChapterBookmark,
  type SparadPost,
} from '../lib/personligt'
import { useAtlas } from '../lib/store'
import { useSidtitel } from '../lib/useSidtitel'
import styles from './SamlingPage.module.css'
import {
  AnteckningsKort,
  anteckningTillKort,
  Grupp,
  Tomlage,
  VandringKort,
  type Kort,
} from './SparatDelar'

type SparadVandring = { vandring: Vandring; senastRum: string | undefined }

const RumGrupp = ({ rum }: { rum: Rum[] }) =>
  rum.length === 0 ? null : (
    <Grupp rubrik="Rum">
      {rum.map((ettRum) => (
        <RumRad key={ettRum.id} rum={ettRum} />
      ))}
    </Grupp>
  )

const VandringGrupp = ({ vandringar }: { vandringar: SparadVandring[] }) =>
  vandringar.length === 0 ? null : (
    <Grupp rubrik="Vandringar">
      {vandringar.map(({ vandring, senastRum }) => (
        <VandringKort key={vandring.id} vandring={vandring} senastRum={senastRum} />
      ))}
    </Grupp>
  )

const BokmarkeGrupp = ({ topics }: { topics: { id: string; title: string; tradition: string; min: number }[] }) =>
  topics.length === 0 ? null : (
    <Grupp rubrik="Bokmärken">
      {topics.map((topic) => (
        <RowLink
          key={topic.id}
          to={{ kind: 'topic', id: topic.id }}
          title={topic.title}
          sub={`${topic.tradition} · ${topic.min} min`}
          chevron
          size="md"
        />
      ))}
    </Grupp>
  )

const KallorGrupp = ({ kapitel }: { kapitel: ChapterBookmark[] }) =>
  kapitel.length === 0 ? null : (
    <Grupp rubrik="Källor">
      {kapitel.map((b) => (
        <RowLink
          key={chapterKey(b.workId, b.bookSlug, b.chapter)}
          to={{ kind: 'kapitel', workId: b.workId, bookSlug: b.bookSlug, chapter: b.chapter }}
          title={b.bookName}
          sub={`Kapitel ${b.chapter}`}
          chevron
          size="md"
        />
      ))}
    </Grupp>
  )

const AnteckningsGrupp = ({ kort }: { kort: Kort[] }) =>
  kort.length === 0 ? null : (
    <Grupp rubrik="Anteckningar">
      {kort.map((k) => (
        <AnteckningsKort key={k.key} title={k.title} text={k.text} datum={k.datum} to={k.to} />
      ))}
    </Grupp>
  )

/** Senast besökt (spec Recently Opened Items): bara orientering, aldrig en
 * krävande kö. Skild från Sparat och rensbar av läsaren. Ingen »Fortsätt
 * läsa«-formulering. */
const SenastBesoktGrupp = ({ rum, onRensa }: { rum: Rum[]; onRensa: () => void }) =>
  rum.length === 0 ? null : (
    <section className={styles.senast}>
      <div className={styles.senastHuvud}>
        <h2 className="kicker sectionKicker">Senast besökt</h2>
        <button type="button" className={styles.rensa} onClick={onRensa}>
          Rensa
        </button>
      </div>
      {rum.map((ettRum) => (
        <RowLink
          key={ettRum.id}
          to={{ kind: 'rum', slug: ettRum.slug }}
          title={ettRum.title}
          sub={ettRum.summary}
          size="md"
        />
      ))}
    </section>
  )

const sparadeVandringarna = (
  sparadeVandringar: Record<string, SparadPost>,
  vandringsplatser: Record<string, string>,
): SparadVandring[] =>
  sparadeIdITidsordning(sparadeVandringar)
    .map((id) => hittaVandringViaId(id))
    .filter((vandring): vandring is Vandring => vandring !== undefined)
    .map((vandring) => ({
      vandring,
      senastRum: hittaRumViaId(vandringsplatser[vandring.id] ?? '')?.title,
    }))

/** Sparat (notes-and-saved.md): en stilla place för det läsaren valt att bevara,
 * grupperat och lätt att överblicka — aldrig ett innehållsflöde, aldrig ett mått
 * på framsteg. Bara grupper med innehåll visas; är inget sparat möter ett lugnt
 * tomläge. Senast besökt ligger separat sist, för orientering. */
export const SamlingPage = () => {
  useSidtitel('Sparat')
  const store = useAtlas()
  const rum = sparadeIdITidsordning(store.sparadeRum)
    .map((id) => hittaRumViaId(id))
    .filter((ettRum): ettRum is Rum => ettRum !== undefined)
  const vandringar = sparadeVandringarna(store.sparadeVandringar, store.vandringsplatser)
  const topics = Object.keys(store.bookmarks)
    .filter((id) => store.bookmarks[id])
    .map(findTopic)
    .filter((topic) => topic !== undefined)
  const kapitel = Object.values(store.chapterBookmarks).sort((a, b) => b.savedAt - a.savedAt)
  const kort = sorteradeAnteckningar(store.anteckningar).map(anteckningTillKort)
  const senast = store.senastLastaRum
    .map((id) => hittaRumViaId(id))
    .filter((ettRum): ettRum is Rum => ettRum !== undefined)

  const ingetSparat =
    rum.length === 0 &&
    vandringar.length === 0 &&
    topics.length === 0 &&
    kapitel.length === 0 &&
    kort.length === 0

  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <h1 className={styles.title}>Sparat</h1>
      <p className={styles.lede}>Det du sparat och tänkt.</p>
      {ingetSparat ? (
        <Tomlage />
      ) : (
        <>
          <RumGrupp rum={rum} />
          <VandringGrupp vandringar={vandringar} />
          <BokmarkeGrupp topics={topics} />
          <KallorGrupp kapitel={kapitel} />
          <AnteckningsGrupp kort={kort} />
        </>
      )}
      <SenastBesoktGrupp rum={senast} onRensa={store.rensaSenastBesokt} />
    </div>
  )
}
