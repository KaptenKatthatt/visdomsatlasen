import { Link } from '@tanstack/react-router'
import { ReadingSettingsButton } from '../../components/ReadingSettingsButton'
import { TopBar } from '../../components/TopBar'
import { useAsync } from '../../lib/useAsync'
import { bookId, fetchChapter } from '../../lib/api'
import { StateNote } from './StateNote'
import styles from './KapitelPage.module.css'

type Props = { workId: string; bookSlug: string; chapter: string }

const NavLink = ({
  workId,
  bookSlug,
  target,
  label,
}: {
  workId: string
  bookSlug: string
  target: number | null
  label: string
}) => {
  if (target === null) return <span />
  return (
    <Link
      to="/kapitel/$workId/$bookSlug/$chapter"
      params={{ workId, bookSlug, chapter: String(target) }}
      className={styles.navLink}
    >
      {label}
    </Link>
  )
}

export const KapitelPage = ({ workId, bookSlug, chapter }: Props) => {
  const n = Number(chapter)
  const id = bookId(workId, bookSlug)
  const { data, loading, error } = useAsync(() => fetchChapter(id, n), [id, n])
  if (!data) {
    return (
      <div className="screenReader">
        <TopBar right={<ReadingSettingsButton />} />
        <StateNote loading={loading} error={error} />
      </div>
    )
  }
  return (
    <div className="screenReader">
      <TopBar right={<ReadingSettingsButton />} />
      <header className={styles.head}>
        <div className="kicker">{data.book.name}</div>
        <h1 className={styles.chapterTitle}>Kapitel {data.chapter}</h1>
      </header>
      <div className={styles.verses}>
        {data.verses.map((verse) => (
          <p key={verse.id} className={styles.verse}>
            <span className={styles.num}>{verse.verse}</span>
            {verse.text}
          </p>
        ))}
      </div>
      <div className={styles.nav}>
        <NavLink workId={workId} bookSlug={bookSlug} target={data.prev} label="‹ Föregående" />
        <NavLink workId={workId} bookSlug={bookSlug} target={data.next} label="Nästa ›" />
      </div>
    </div>
  )
}
