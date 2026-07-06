import { Link } from '@tanstack/react-router'
import { TopBar } from '../../components/TopBar'
import { useAsync } from '../../lib/useAsync'
import { bookId, fetchWork } from '../../lib/api'
import { StateNote } from './StateNote'
import styles from './Bibliotek.module.css'

export const BokPage = ({ workId, bookSlug }: { workId: string; bookSlug: string }) => {
  const { data, loading, error } = useAsync(() => fetchWork(workId), [workId])
  const id = bookId(workId, bookSlug)
  const book = data?.books.find((candidate) => candidate.id === id) ?? null
  if (!book) {
    return (
      <div className="screenSub">
        <TopBar />
        <StateNote loading={loading} error={error} />
      </div>
    )
  }
  const chapters = book.chapters
  return (
    <div className="screenSub">
      <TopBar />
      <header className={styles.group}>
        <div className="kicker">{data?.work.title}</div>
        <h1 className={styles.title}>{book.name}</h1>
        <p className={styles.rowSub}>{book.chapterCount} kapitel</p>
      </header>
      <div className={styles.chapterGrid}>
        {chapters.map((n) => (
          <Link
            key={n}
            to="/kapitel/$workId/$bookSlug/$chapter"
            params={{ workId, bookSlug, chapter: String(n) }}
            className={styles.chapterCell}
          >
            {n}
          </Link>
        ))}
      </div>
    </div>
  )
}
