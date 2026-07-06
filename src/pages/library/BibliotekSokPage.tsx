import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { TopBar } from '../../components/TopBar'
import { useAsync } from '../../lib/useAsync'
import { searchLibrary, slugOfBook, type SearchHit } from '../../lib/api'
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
  const term = query.trim()
  const { data } = useAsync(
    () => (term.length >= 2 ? searchLibrary(term) : Promise.resolve({ hits: [] })),
    [term],
  )
  return (
    <div className="screenReader">
      <TopBar />
      <input
        className={styles.searchInput}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Sök i alla texter …"
        aria-label="Sök i biblioteket"
        autoFocus
      />
      <div style={{ marginTop: 20 }}>
        {data?.hits.map((hit) => (
          <HitRow key={`${hit.bookId}-${hit.chapter}-${hit.verse}`} hit={hit} />
        ))}
        {term.length >= 2 && data?.hits.length === 0 && (
          <p className={styles.stateNote}>Inga träffar på ”{term}”.</p>
        )}
      </div>
    </div>
  )
}
