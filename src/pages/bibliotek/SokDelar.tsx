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
import { NoteCard, noteToCard } from '../SparatDelar'
import styles from './Sok.module.css'

/** The verse search's response from the server (the reader's FTS over the source texts). */
export type SourceTextResponse = { books: BookHit[]; hits: SearchHit[] }

/** The »Visa fler« control: reveals the hidden hits in a group. Renders nothing
 * when nothing is hidden — the result is always finite (search.md, Number of Results). */
const VisaFler = ({ dolda, onClick }: { dolda: number; onClick: () => void }) =>
  dolda <= 0 ? null : (
    <button type="button" className={styles.visaFler} onClick={onClick}>
      Visa fler ({dolda})
    </button>
  )

const HitRow = ({ traff }: { traff: SearchResult }) => {
  const { title, subtitle, meta, target } = traff.document
  const innehåll = (
    <span>
      <span className={styles.rowTitle}>{title}</span>
      {subtitle !== undefined && <span className={styles.rowSub}>{subtitle}</span>}
      {meta !== undefined && <span className={styles.rowMeta}>{meta}</span>}
    </span>
  )
  if (target === undefined) return <div className={styles.quietRow}>{innehåll}</div>
  return (
    <ToLink to={target} className={styles.row}>
      {innehåll}
      <span className={styles.chev}>›</span>
    </ToLink>
  )
}

const SearchGroupSection = ({
  synlig,
  onVisaFler,
}: {
  synlig: VisibleGroup
  onVisaFler: () => void
}) => (
  <section className={styles.grupp}>
    <h2 className="kicker sectionKicker">{synlig.group.heading}</h2>
    {synlig.visible.map((traff) => (
      <HitRow key={traff.document.id} traff={traff} />
    ))}
    <VisaFler dolda={synlig.hidden} onClick={onVisaFler} />
  </section>
)

// Private note hits — their own group last, each card clearly marked private.
// Finite like the other groups: at most five, the rest behind »Visa fler«. Reset
// per query by the page keying the component (key={nyckel}).
const NoteGroupSearch = ({ anteckningar }: { anteckningar: Note[] }) => {
  const [visaAlla, setVisaAlla] = useState(false)
  if (anteckningar.length === 0) return null
  const synliga = visaAlla ? anteckningar : anteckningar.slice(0, MAX_VISIBLE_PER_GROUP)
  return (
    <section className={styles.grupp}>
      <h2 className="kicker sectionKicker">Anteckningar</h2>
      {synliga.map((anteckning) => {
        const kort = noteToCard(anteckning)
        return (
          <div key={kort.key} className={styles.privatKort}>
            <span className={styles.privatMarkor}>Privat anteckning</span>
            <NoteCard title={kort.title} text={kort.text} datum={kort.datum} to={kort.to} />
          </div>
        )
      })}
      <VisaFler dolda={anteckningar.length - synliga.length} onClick={() => setVisaAlla(true)} />
    </section>
  )
}

// Renders the FTS snippet with ⟦…⟧ markers as highlighted hit words (accessible
// markup, not color alone).
const Snippet = ({ text }: { text: string }) => (
  <span className={styles.snippet}>
    {text.split(/⟦|⟧/).map((del, i) =>
      i % 2 === 1 ? (
        <mark key={i} className={styles.mark}>
          {del}
        </mark>
      ) : (
        <span key={i}>{del}</span>
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
  svar,
  fel,
}: {
  svar: SourceTextResponse | null
  fel: string | null
}) => {
  const [visaAlla, setVisaAlla] = useState(false)
  if (fel !== null)
    return (
      <section className={styles.grupp}>
        <h2 className="kicker sectionKicker">Ur källtexterna</h2>
        <p className={styles.emptyHint}>Sökningen i källtexterna kunde inte genomföras just nu.</p>
      </section>
    )
  if (svar === null || (svar.books.length === 0 && svar.hits.length === 0)) return null
  const verses = visaAlla ? svar.hits : svar.hits.slice(0, MAX_VISIBLE_PER_GROUP)
  const dolda = svar.hits.length - verses.length
  return (
    <section className={styles.grupp}>
      <h2 className="kicker sectionKicker">Ur källtexterna</h2>
      {svar.books.map((hit) => (
        <BookRow key={hit.bookId} hit={hit} />
      ))}
      {verses.map((hit) => (
        <VerseRow key={`${hit.bookId}-${hit.chapter}-${hit.verse}`} hit={hit} />
      ))}
      <VisaFler dolda={dolda} onClick={() => setVisaAlla(true)} />
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
    onSubmit={(händelse) => {
      händelse.preventDefault()
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
      onChange={(händelse) => onChange(händelse.target.value)}
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
  <div className={styles.tillstand} role="status">
    <p className={styles.emptyText}>Vi hittade inget som stämde med din sökning.</p>
    <p className={styles.emptyHint}>
      Prova ett bredare ord eller sök efter en fråga, ett tema eller en källa.
                            </p>
  </div>
)

const ErrorState = () => (
  <div className={styles.tillstand} role="status">
    <p className={styles.emptyText}>Sökningen kunde inte genomföras just nu.</p>
    <p className={styles.emptyHint}>Försök igen eller gå tillbaka till Biblioteket.</p>
  </div>
)

export type SearchMode = 'tom' | 'fel' | 'klar'

const hitCount = (antal: number): string => (antal === 1 ? '1 träff' : `${antal} träffar`)

/** The result view: empty state before searching, error state, no-results or the grouped,
 * finite hits — editorial groups, then »Ur källtexterna«, last the
 * private notes group. `ingaTraffar` is decided by the page (which also counts
 * the verse search) so no-results is never shown while source-text hits are on the way. */
export const ResultView = ({
  läge,
  ingaTraffar,
  synliga,
  kalltext,
  notes,
  nyckel,
  antal,
  onVisaFler,
}: {
  läge: SearchMode
  ingaTraffar: boolean
  synliga: VisibleGroup[]
  kalltext: ReactNode
  notes: Note[]
  nyckel: string
  antal: number
  onVisaFler: (type: SearchType) => void
}) => {
  if (läge === 'tom') return <SearchEmptyState />
  if (läge === 'fel') return <ErrorState />
  if (ingaTraffar) return <NoHits />
  return (
    <>
      <p role="status" className={styles.status}>
        {hitCount(antal)}
      </p>
      {synliga.map((synlig) =>
        synlig.visible.length > 0 || synlig.hidden > 0 ? (
          <SearchGroupSection
            key={synlig.group.type}
            synlig={synlig}
            onVisaFler={() => onVisaFler(synlig.group.type)}
          />
        ) : null,
      )}
      {kalltext}
      <NoteGroupSearch key={nyckel} anteckningar={notes} />
    </>
  )
}

// The filter options are derived from the shared search-type list and the group labels, so a new
// type doesn't need to be added in more places than sokindex/soklogik.
const TYPVAL: Array<{ värde: SearchType | 'alla'; label: string }> = [
  { värde: 'alla', label: 'Alla' },
  ...SEARCH_TYPES.map((type) => ({ värde: type, label: HEADINGS[type] })),
]

/** Optional, collapsed type filters (search.md, Filters): never required before searching,
 * an active filter clear and easy to reset. */
export const Filter = ({
  aktiv,
  antal,
  onVal,
}: {
  aktiv: SearchType | undefined
  antal: number
  onVal: (type: SearchType | undefined) => void
}) => {
  const [öppen, setÖppen] = useState(false)
  return (
    <div className={styles.filter}>
      <button
        type="button"
        className={styles.filterButton}
        aria-expanded={öppen}
        onClick={() => setÖppen((v) => !v)}
      >
        Filtrera
      </button>
      {öppen && (
        <div className={styles.filterRow}>
          {TYPVAL.map((val) => {
            const vald = val.värde === 'alla' ? aktiv === undefined : aktiv === val.värde
            return (
              <button
                key={val.värde}
                type="button"
                className={vald ? styles.chipVald : styles.chip}
                aria-pressed={vald}
                onClick={() => onVal(val.värde === 'alla' ? undefined : val.värde)}
              >
                {val.label}
              </button>
            )
          })}
        </div>
      )}
      {aktiv !== undefined && (
        <p className={styles.filterInfo}>
          {hitCount(antal)} ·{' '}
          <button type="button" className={styles.clear} onClick={() => onVal(undefined)}>
            Rensa filter
          </button>
        </p>
      )}
    </div>
  )
}
