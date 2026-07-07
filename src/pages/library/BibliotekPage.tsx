import { Link } from '@tanstack/react-router'
import { SearchIcon } from '../../components/Icons'
import { useAsync } from '../../lib/useAsync'
import { fetchWorks, type WorkSummary } from '../../lib/api'
import { OfflineButton } from './OfflineButton'
import { StateNote } from './StateNote'
import styles from './Bibliotek.module.css'

const groupByTradition = (works: WorkSummary[]): [string, WorkSummary[]][] => {
  const map = new Map<string, WorkSummary[]>()
  for (const work of works) {
    const list = map.get(work.tradition) ?? []
    list.push(work)
    map.set(work.tradition, list)
  }
  return [...map.entries()]
}

const WorkRow = ({ work }: { work: WorkSummary }) => (
  <Link to="/bibliotek/$workId" params={{ workId: work.id }} className={styles.row}>
    <span>
      <span className={styles.rowTitle}>
        {work.title}
        {work.translated ? <span className={styles.badge}>översatt</span> : null}
      </span>
      <span className={styles.rowSub}>
        {work.translation} · {work.bookCount} böcker · {work.verseCount} verser
      </span>
    </span>
    <span className={styles.chev}>›</span>
  </Link>
)

export const BibliotekPage = () => {
  const { data, loading, error } = useAsync(fetchWorks, [])
  return (
    <div className="screenTab">
      <div className={styles.header}>
        <div className="kicker">Visdomsatlasen</div>
        <Link to="/bibliotek-sok" aria-label="Sök i texterna" className="iconBtn">
          <SearchIcon />
        </Link>
      </div>
      <h1 className={styles.title}>Bibliotek</h1>
      <p className={styles.lede}>
        Hela källtexter att läsa och söka fritt i — offline när du hämtat hem dem.
      </p>
      {!data && <StateNote loading={loading} error={error} />}
      {data?.works.length === 0 && (
        <p className={styles.stateNote}>Inga texter ännu. Kör ingest på servern.</p>
      )}
      {data &&
        groupByTradition(data.works).map(([tradition, works]) => (
          <div key={tradition} className={styles.group}>
            <div className="kicker">{tradition}</div>
            <div className={styles.groupRows}>
              {works.map((work) => (
                <WorkRow key={work.id} work={work} />
              ))}
            </div>
          </div>
        ))}
      {data && <OfflineButton />}
    </div>
  )
}
