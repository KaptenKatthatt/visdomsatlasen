import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { TopBar } from '../../components/TopBar'
import { useAsync } from '../../lib/useAsync'
import { useSidtitel } from '../../lib/useSidtitel'
import { fetchWork, slugOfBook, type Book } from '../../lib/api'
import { StateNote } from './StateNote'
import styles from './Bibliotek.module.css'

const BookRow = ({ workId, book }: { workId: string; book: Book }) => (
  <Link
    to="/bibliotek/verk/$workId/$bookSlug"
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
  useSidtitel(data?.work.title)
  const [filter, setFilter] = useState('')
  const navigate = useNavigate()
  const goUp = () => navigate({ to: '/bibliotek/verk' })
  if (!data) {
    return (
      <div className="screenSub">
        <TopBar onBack={goUp} />
        <StateNote loading={loading} error={error} />
      </div>
    )
  }
  const needle = filter.trim().toLowerCase()
  const books = needle
    ? data.books.filter((b) => `${b.name} ${b.abbrev}`.toLowerCase().includes(needle))
    : data.books
  return (
    <div className="screenSub">
      <TopBar onBack={goUp} />
      <header className={styles.group}>
        <div className="kicker">{data.work.tradition}</div>
        <h1 className={styles.title}>{data.work.title}</h1>
        {data.work.subtitle && <p className={styles.metaLine}>{data.work.subtitle}</p>}
        <p className={styles.rowSub}>
          {data.work.author} · {data.work.translation} · {data.work.license}
        </p>
      </header>
      {(data.books.length > 5 || filter.length > 0) && (
        <input
          className={styles.searchInput}
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Sök bok, t.ex. Matteus …"
          aria-label="Sök bok"
        />
      )}
      <div className={styles.groupRows}>
        {books.map((book) => (
          <BookRow key={book.id} workId={workId} book={book} />
        ))}
        {needle.length > 0 && books.length === 0 && (
          <p className={styles.stateNote}>Ingen bok matchar ”{filter}”.</p>
        )}
      </div>
    </div>
  )
}
