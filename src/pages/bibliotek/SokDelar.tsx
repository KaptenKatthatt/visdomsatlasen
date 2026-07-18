// Presentationsdelar för bibliotekssöket (search.md): grupperade resultat,
// ändliga med »Visa fler«, samt lugna tom-/no-results-/fellägen. Ingen del visar
// popularitet, förlopp eller orelaterade rekommendationer.
import { Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { ToLink } from '../../components/ToLink'
import { slugOfBook, type BookHit, type SearchHit } from '../../lib/api'
import type { Note } from '../../lib/personal'
import { SEARCH_TYPES, type SearchType } from '../../lib/searchIndex'
import { MAX_SYNLIGA_PER_GRUPP, RUBRIK, type SearchResult, type VisibleGroup } from '../../lib/searchLogic'
import { NoteCard, noteToCard } from '../SparatDelar'
import styles from './Sok.module.css'

/** Verssökets svar från servern (verkläsarens FTS över källtexterna). */
export type SourceTextResponse = { books: BookHit[]; hits: SearchHit[] }

/** »Visa fler«-kontrollen: röjer de dolda träffarna i en grupp. Renderar inget
 * när inget är dolt — resultatet är alltid ändligt (search.md, Number of Results). */
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
      <span className={styles.radTitel}>{title}</span>
      {subtitle !== undefined && <span className={styles.radSub}>{subtitle}</span>}
      {meta !== undefined && <span className={styles.radMeta}>{meta}</span>}
    </span>
  )
  if (target === undefined) return <div className={styles.stillaRad}>{innehåll}</div>
  return (
    <ToLink to={target} className={styles.rad}>
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

// Privata anteckningsträffar — egen grupp sist, varje kort tydligt märkt privat.
// Ändlig som övriga grupper: som mest fem, resten bakom »Visa fler«. Nollställs
// per fråga genom att sidan nyckar komponenten (key={nyckel}).
const NoteGroupSearch = ({ anteckningar }: { anteckningar: Note[] }) => {
  const [visaAlla, setVisaAlla] = useState(false)
  if (anteckningar.length === 0) return null
  const synliga = visaAlla ? anteckningar : anteckningar.slice(0, MAX_SYNLIGA_PER_GRUPP)
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

// Renderar FTS-snippeten med ⟦…⟧-markörer som markerade träfford (tillgänglig
// markup, inte enbart färg).
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
    className={styles.rad}
  >
    <span>
      <span className={styles.radTitel}>{hit.bookName}</span>
      <span className={styles.radSub}>{hit.workTitle}</span>
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
    className={styles.kalltextHit}
  >
    <span className={styles.hitRef}>
      {hit.workTitle} · {hit.bookName} {hit.chapter}:{hit.verse}
    </span>
    <Snippet text={hit.snippet} />
  </Link>
)

/** Gruppen »Ur källtexterna«: verkläsarens FTS-verssök som en del av det samlade
 * söket (behåller /bibliotek-sok orörd). Tyst laddning — gruppen dyker upp när
 * data finns; vid fel en lugn rad, aldrig orelaterat innehåll. */
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
        <p className={styles.tomhint}>Sökningen i källtexterna kunde inte genomföras just nu.</p>
      </section>
    )
  if (svar === null || (svar.books.length === 0 && svar.hits.length === 0)) return null
  const verses = visaAlla ? svar.hits : svar.hits.slice(0, MAX_SYNLIGA_PER_GRUPP)
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

/** Sökfältet: programmatiskt kopplad label, Enter söker direkt, Escape rensar
 * (type=search). Normal tab-order. */
export const Sokfalt = ({
  query,
  onChange,
  onSubmit,
}: {
  query: string
  onChange: (värde: string) => void
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
      className={styles.falt}
      value={query}
      onChange={(händelse) => onChange(händelse.target.value)}
      placeholder="Sök efter en fråga, tanke eller källa"
      // Hela skärmen är sök — fältet är sidans enda uppgift och nås avsiktligt.
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
    />
  </form>
)

const SearchEmptyState = () => (
  <p className={styles.tomtext}>Sök bland frågor, rum, källor och traditioner.</p>
)

const NoHits = () => (
  <div className={styles.tillstand} role="status">
    <p className={styles.tomtext}>Vi hittade inget som stämde med din sökning.</p>
    <p className={styles.tomhint}>
      Prova ett bredare ord eller sök efter en fråga, ett tema eller en källa.
                            </p>
  </div>
)

const Fellage = () => (
  <div className={styles.tillstand} role="status">
    <p className={styles.tomtext}>Sökningen kunde inte genomföras just nu.</p>
    <p className={styles.tomhint}>Försök igen eller gå tillbaka till Biblioteket.</p>
  </div>
)

export type SearchMode = 'tom' | 'fel' | 'klar'

const hitCount = (antal: number): string => (antal === 1 ? '1 träff' : `${antal} träffar`)

/** Resultatvyn: tomläge före sökning, felläge, no-results eller de grupperade,
 * ändliga träffarna — redaktionella grupper, sedan »Ur källtexterna«, sist den
 * privata anteckningsgruppen. `ingaTraffar` avgörs av sidan (räknar även in
 * verssöket) så no-results aldrig visas medan källtextträffar är på väg. */
export const Resultatvy = ({
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
  if (läge === 'fel') return <Fellage />
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

// Filtervalen härleds ur den delade söktyplistan och gruppetiketterna, så en ny
// type inte behöver läggas till på fler ställen än sokindex/soklogik.
const TYPVAL: Array<{ värde: SearchType | 'alla'; label: string }> = [
  { värde: 'alla', label: 'Alla' },
  ...SEARCH_TYPES.map((type) => ({ värde: type, label: RUBRIK[type] })),
]

/** Valfria, hopfällda typfilter (search.md, Filters): aldrig krav före sökning,
 * aktivt filter tydligt och lätt att rensa. */
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
        className={styles.filterknapp}
        aria-expanded={öppen}
        onClick={() => setÖppen((v) => !v)}
      >
        Filtrera
      </button>
      {öppen && (
        <div className={styles.filterrad}>
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
        <p className={styles.filterinfo}>
          {hitCount(antal)} ·{' '}
          <button type="button" className={styles.rensa} onClick={() => onVal(undefined)}>
            Rensa filter
          </button>
        </p>
      )}
    </div>
  )
}
