// Presentation parts for the library search (search.md): grouped results,
// finite with »Visa fler«, plus calm empty/no-results/error states. No part shows
// popularity, progress or unrelated recommendations.
import { Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { ToLink } from '../../components/ToLink'
import { slugOfBook, type BookHit, type SearchHit } from '../../lib/api'
import type { Note } from '../../lib/personal'
import { SEARCH_TYPES, type SearchType } from '../../lib/searchIndex'
import { MAX_VISIBLE_PER_GROUP, HEADINGS, type SearchResult, type VisibleGroup } from '../../lib/searchLogic'
import { NoteCard, noteToCard } from '../SavedParts'
import styles from './Search.module.css'

/** The verse search's response from the server (the reader's FTS over the source texts). */
export type SourceTextResponse = { books: BookHit[]; hits: SearchHit[] }

/** The »Visa fler« control: reveals the hidden hits in a group. Renders nothing
 * when nothing is hidden — the result is always finite (search.md, Number of Results). */
const ShowMore = ({ hidden, onClick }: { hidden: number; onClick: () => void }) =>
  hidden <= 0 ? null : (
    <button type="button" className={styles.showMore} onClick={onClick}>
      Visa fler ({hidden})
    </button>
  )

const HitRow = ({ hit }: { hit: SearchResult }) => {
  const { title, subtitle, meta, target } = hit.document
  const content = (
    <span>
      <span className={styles.rowTitle}>{title}</span>
      {subtitle !== undefined && <span className={styles.rowSub}>{subtitle}</span>}
      {meta !== undefined && <span className={styles.rowMeta}>{meta}</span>}
    </span>
  )
  if (target === undefined) return <div className={styles.quietRow}>{content}</div>
  return (
    <ToLink to={target} className={styles.row}>
      {content}
      <span className={styles.chev}>›</span>
    </ToLink>
  )
}

const SearchGroupSection = ({
  visible,
  onVisaFler,
}: {
  visible: VisibleGroup
  onVisaFler: () => void
}) => (
  <section className={styles.grupp}>
    <h2 className="kicker sectionKicker">{visible.group.heading}</h2>
    {visible.visible.map((hit) => (
      <HitRow key={hit.document.id} hit={hit} />
    ))}
    <ShowMore hidden={visible.hidden} onClick={onVisaFler} />
  </section>
)

// Private note hits — their own group last, each card clearly marked private.
// Finite like the other groups: at most five, the rest behind »Visa fler«. Reset
// per query by the page keying the component (key={nyckel}).
const NoteGroupSearch = ({ notes }: { notes: Note[] }) => {
  const [showAll, setVisaAlla] = useState(false)
  if (notes.length === 0) return null
  const visible = showAll ? notes : notes.slice(0, MAX_VISIBLE_PER_GROUP)
  return (
    <section className={styles.grupp}>
      <h2 className="kicker sectionKicker">Anteckningar</h2>
      {visible.map((note) => {
        const short = noteToCard(note)
        return (
          <div key={short.key} className={styles.privateCard}>
            <span className={styles.privateMark}>Privat anteckning</span>
            <NoteCard title={short.title} text={short.text} date={short.date} to={short.to} />
          </div>
        )
      })}
      <ShowMore hidden={notes.length - visible.length} onClick={() => setVisaAlla(true)} />
    </section>
  )
}

// Renders the FTS snippet with ⟦…⟧ markers as highlighted hit words (accessible
// markup, not color alone).
const Snippet = ({ text }: { text: string }) => (
  <span className={styles.snippet}>
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

const BookRow = ({ hit }: { hit: BookHit }) => (
  <Link
    to="/bibliotek/verk/$workId/$bookSlug"
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

const VerseRow = ({ hit }: { hit: SearchHit }) => (
  <Link
    to="/kapitel/$workId/$bookSlug/$chapter"
    params={{
      workId: hit.workId,
      bookSlug: slugOfBook(hit.workId, hit.bookId),
      chapter: String(hit.chapter),
    }}
    className={styles.sourceTextHit}
  >
    <span className={styles.hitRef}>
      {hit.workTitle} · {hit.bookName} {hit.chapter}:{hit.verse}
    </span>
    <Snippet text={hit.snippet} />
  </Link>
)

/** The »Ur källtexterna« group: the reader's FTS verse search as part of the combined
 * search (keeps /bibliotek-sok untouched). Silent loading — the group appears when
 * data exists; on error a calm line, never unrelated content. */
export const SourceTextGroup = ({
  response,
  error,
}: {
  response: SourceTextResponse | null
  error: string | null
}) => {
  const [showAll, setVisaAlla] = useState(false)
  if (error !== null)
    return (
      <section className={styles.grupp}>
        <h2 className="kicker sectionKicker">Ur källtexterna</h2>
        <p className={styles.emptyHint}>Sökningen i källtexterna kunde inte genomföras just nu.</p>
      </section>
    )
  if (response === null || (response.books.length === 0 && response.hits.length === 0)) return null
  const verses = showAll ? response.hits : response.hits.slice(0, MAX_VISIBLE_PER_GROUP)
  const hidden = response.hits.length - verses.length
  return (
    <section className={styles.grupp}>
      <h2 className="kicker sectionKicker">Ur källtexterna</h2>
      {response.books.map((hit) => (
        <BookRow key={hit.bookId} hit={hit} />
      ))}
      {verses.map((hit) => (
        <VerseRow key={`${hit.bookId}-${hit.chapter}-${hit.verse}`} hit={hit} />
      ))}
      <ShowMore hidden={hidden} onClick={() => setVisaAlla(true)} />
    </section>
  )
}

/** The search field: programmatically linked label, Enter searches immediately, Escape clears
 * (type=search). Normal tab order. */
export const SearchField = ({
  query,
  onChange,
  onSubmit,
}: {
  query: string
  onChange: (value: string) => void
  onSubmit: () => void
}) => (
  <form
    role="search"
    onSubmit={(event) => {
      event.preventDefault()
      onSubmit()
    }}
  >
    <label htmlFor="bibliotekssok" className={styles.srOnly}>
      Sök i biblioteket
    </label>
    <input
      id="bibliotekssok"
      type="search"
      className={styles.field}
      value={query}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Sök efter en fråga, tanke eller källa"
      // The whole screen is search — the field is the page's sole purpose and is reached deliberately.
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
    />
  </form>
)

const SearchEmptyState = () => (
  <p className={styles.emptyText}>Sök bland frågor, rum, källor och traditioner.</p>
)

const NoHits = () => (
  <div className={styles.state} role="status">
    <p className={styles.emptyText}>Vi hittade inget som stämde med din sökning.</p>
    <p className={styles.emptyHint}>
      Prova ett bredare ord eller sök efter en fråga, ett tema eller en källa.
                            </p>
  </div>
)

const ErrorState = () => (
  <div className={styles.state} role="status">
    <p className={styles.emptyText}>Sökningen kunde inte genomföras just nu.</p>
    <p className={styles.emptyHint}>Försök igen eller gå tillbaka till Biblioteket.</p>
  </div>
)

export type SearchMode = 'tom' | 'fel' | 'klar'

const hitCount = (count: number): string => (count === 1 ? '1 träff' : `${count} träffar`)

/** The result view: empty state before searching, error state, no-results or the grouped,
 * finite hits — editorial groups, then »Ur källtexterna«, last the
 * private notes group. `ingaTraffar` is decided by the page (which also counts
 * the verse search) so no-results is never shown while source-text hits are on the way. */
export const ResultView = ({
  mode,
  noHits,
  visible,
  sourceText,
  notes,
  key,
  count,
  onVisaFler,
}: {
  mode: SearchMode
  noHits: boolean
  visible: VisibleGroup[]
  sourceText: ReactNode
  notes: Note[]
  key: string
  count: number
  onVisaFler: (type: SearchType) => void
}) => {
  if (mode === 'tom') return <SearchEmptyState />
  if (mode === 'fel') return <ErrorState />
  if (noHits) return <NoHits />
  return (
    <>
      <p role="status" className={styles.status}>
        {hitCount(count)}
      </p>
      {visible.map((visible) =>
        visible.visible.length > 0 || visible.hidden > 0 ? (
          <SearchGroupSection
            key={visible.group.type}
            visible={visible}
            onVisaFler={() => onVisaFler(visible.group.type)}
          />
        ) : null,
      )}
      {sourceText}
      <NoteGroupSearch key={key} notes={notes} />
    </>
  )
}

// The filter options are derived from the shared search-type list and the group labels, so a new
// type doesn't need to be added in more places than sokindex/soklogik.
const TYPVAL: Array<{ value: SearchType | 'alla'; label: string }> = [
  { value: 'alla', label: 'Alla' },
  ...SEARCH_TYPES.map((type) => ({ value: type, label: HEADINGS[type] })),
]

/** Optional, collapsed type filters (search.md, Filters): never required before searching,
 * an active filter clear and easy to reset. */
export const Filter = ({
  active,
  count,
  onVal,
}: {
  active: SearchType | undefined
  count: number
  onVal: (type: SearchType | undefined) => void
}) => {
  const [open, setOpen] = useState(false)
  return (
    <div className={styles.filter}>
      <button
        type="button"
        className={styles.filterButton}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Filtrera
      </button>
      {open && (
        <div className={styles.filterRow}>
          {TYPVAL.map((val) => {
            const selected = val.value === 'alla' ? active === undefined : active === val.value
            return (
              <button
                key={val.value}
                type="button"
                className={selected ? styles.chipVald : styles.chip}
                aria-pressed={selected}
                onClick={() => onVal(val.value === 'alla' ? undefined : val.value)}
              >
                {val.label}
              </button>
            )
          })}
        </div>
      )}
      {active !== undefined && (
        <p className={styles.filterInfo}>
          {hitCount(count)} ·{' '}
          <button type="button" className={styles.clear} onClick={() => onVal(undefined)}>
            Rensa filter
          </button>
        </p>
      )}
    </div>
  )
}
