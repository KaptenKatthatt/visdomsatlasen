import { Link } from '@tanstack/react-router'
import { TopBar } from '../../components/TopBar'
import { useAsync } from '../../lib/useAsync'
import { fetchWork, slugOfBook, type Book } from '../../lib/api'
import { StateNote } from './StateNote'
import styles from './Bibliotek.module.css'

const BookRow = ({ workId, book }: { workId: string; book: Book }) => (
  <Link
    to="/bibliotek/$workId/$bookSlug"
    params={{ workId, bookSlug: slugOfBook(workId, book.id) }}
    className={styles.row}
  >
    <span>
      <span className={styles.rowTitle}>{book.name}</span>
      <span className={styles.rowSub}>{book.chapterCount} kapitel</span>
    </span>
    <span className={styles.chev}>›</span>
  </Link>
)

export const VerkPage = ({ workId }: { workId: string }) => {
  const { data, loading, error } = useAsync(() => fetchWork(workId), [workId])
  if (!data) {
    return (
      <div className="screenSub">
        <TopBar />
        <StateNote loading={loading} error={error} />
      </div>
    )
  }
  return (
    <div className="screenSub">
      <TopBar />
      <header className={styles.group}>
        <div className="kicker">{data.work.tradition}</div>
        <h1 className={styles.title}>{data.work.title}</h1>
        {data.work.subtitle && <p className={styles.metaLine}>{data.work.subtitle}</p>}
        <p className={styles.rowSub}>
          {data.work.author} · {data.work.translation} · {data.work.license}
        </p>
      </header>
      <div className={styles.groupRows}>
        {data.books.map((book) => (
          <BookRow key={book.id} workId={workId} book={book} />
        ))}
      </div>
    </div>
  )
}
