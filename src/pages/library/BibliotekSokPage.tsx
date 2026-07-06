import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { TopBar } from '../../components/TopBar'
import { useAsync } from '../../lib/useAsync'
import { useDebounced } from '../../lib/useDebounced'
import { searchLibrary, slugOfBook, type BookHit, type SearchHit } from '../../lib/api'
import styles from './Bibliotek.module.css'

// Rendera FTS-snippeten med ⟦…⟧-markörer som markerade träfford.
const Snippet = ({ text }: { text: string }) => (
  <span className={styles.hitSnippet}>
    {text.split(/⟦|⟧/).map((part, i) =>
      i % 2 === 1 ? (
        <mark key={i} className={styles.mark}>
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      ),
    )}
  </span>
)

// Boktreff: leder till bokens kapitelöversikt (t.ex. sök "matteus" → boken).
const BookHitRow = ({ hit }: { hit: BookHit }) => (
  <Link
    to="/bibliotek/$workId/$bookSlug"
    params={{ workId: hit.workId, bookSlug: slugOfBook(hit.workId, hit.bookId) }}
    className={styles.row}
  >
    <span>
      <span className={styles.rowTitle}>{hit.bookName}</span>
      <span className={styles.rowSub}>{hit.workTitle}</span>
    </span>
    <span className={styles.chev}>›</span>
  </Link>
)

const HitRow = ({ hit }: { hit: SearchHit }) => (
  <Link
    to="/kapitel/$workId/$bookSlug/$chapter"
    params={{
      workId: hit.workId,
      bookSlug: slugOfBook(hit.workId, hit.bookId),
      chapter: String(hit.chapter),
    }}
    className={styles.hit}
  >
    <span className={styles.hitRef}>
      {hit.workTitle} · {hit.bookName} {hit.chapter}:{hit.verse}
    </span>
    <Snippet text={hit.snippet} />
  </Link>
)

export const BibliotekSokPage = () => {
  const [query, setQuery] = useState('')
  // Debounce så vi inte skickar en sökning per tangenttryck.
  const term = useDebounced(query.trim(), 250)
  const { data } = useAsync(
    () => (term.length >= 2 ? searchLibrary(term) : Promise.resolve({ books: [], hits: [] })),
    [term],
  )
  const empty = term.length >= 2 && data?.books.length === 0 && data.hits.length === 0
  return (
    <div className="screenReader">
      <TopBar />
      <input
        className={styles.searchInput}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Sök böcker och verser …"
        aria-label="Sök i biblioteket"
        autoFocus
      />
      <div style={{ marginTop: 20 }}>
        {data && data.books.length > 0 && (
          <div className={styles.group}>
            <div className="kicker sectionKicker">Böcker</div>
            {data.books.map((hit) => (
              <BookHitRow key={hit.bookId} hit={hit} />
            ))}
          </div>
        )}
        {data && data.hits.length > 0 && (
          <div className={styles.group}>
            <div className="kicker sectionKicker">Verser</div>
            {data.hits.map((hit) => (
              <HitRow key={`${hit.bookId}-${hit.chapter}-${hit.verse}`} hit={hit} />
            ))}
          </div>
        )}
        {empty && <p className={styles.stateNote}>Inga träffar på ”{term}”.</p>}
      </div>
    </div>
  )
}
