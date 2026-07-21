import { Link } from '@tanstack/react-router'
import { ToLink } from '../../components/ToLink'
import {
  libraryPeople,
  librarySources,
  libraryTraditions,
  libraryPaths,
  roomsForPath,
  pathReadingTime,
} from '../../lib/library'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import {
  allSources,
  allPeople,
  allRooms,
  allTraditions,
  allPaths,
  sourceName,
} from '../../lib/content'
import styles from './Library.module.css'
import { Row, roomCount, Section } from './LibraryParts'

// Paths are an optional, quiet entry (paths.md, Discoverability) — they
// must not stand as an empty, promising section, so it's hidden until published
// paths exist (the same discipline as the traditions). Drafts are reviewed via
// a direct link.
const PathSection = () => {
  const paths = libraryPaths(allPaths)
  if (paths.length === 0) return null
  return (
    <Section heading="Vandringar">
      {paths.map((path) => {
        const rooms = roomsForPath(path, allRooms)
        const sub = `${roomCount(rooms.length)} · ca ${pathReadingTime(rooms)} min`
        return (
          <ToLink
            key={path.id}
            to={{ kind: 'vandring', slug: path.slug }}
            className={styles.row}
          >
            <Row title={path.title} sub={sub} />
          </ToLink>
        )
      })}
    </Section>
  )
}

const SourceSection = () => (
  <Section heading="Källor">
    {librarySources(allSources).map((source) => (
      <ToLink key={source.id} to={{ kind: 'kallpost', slug: source.slug }} className={styles.row}>
        <Row title={source.title} sub={sourceName(source)} />
      </ToLink>
    ))}
    <Link to="/bibliotek/verk" className={styles.row}>
      <Row title="Hela texter" sub="Källtexterna i sin helhet, att läsa och söka i" />
    </Link>
  </Section>
)

// Traditions are a secondary entry without pages of their own yet (roadmap phase 6:
// support entries). The section appears only when published traditions exist.
const Traditionssektion = () => {
  const traditions = libraryTraditions(allTraditions)
  if (traditions.length === 0) return null
  return (
    <Section heading="Traditioner">
      {traditions.map((tradition) => (
        <div key={tradition.id} className={styles.quietRow}>
          <span className={styles.rowTitle}>{tradition.name}</span>
          {tradition.description && (
            <span className={styles.rowSub}>{tradition.description}</span>
          )}
        </div>
      ))}
    </Section>
  )
}

// People are reference points, not entries (library.md, People and Authors).
// The section stands last for now (editor's decision 2026-07-18) and is hidden
// until published people exist — the same discipline as the paths.
const Personsektion = () => {
  const people = libraryPeople(allPeople)
  if (people.length === 0) return null
  return (
    <Section heading="Personer">
      {people.map((person) => (
        <ToLink
          key={person.id}
          to={{ kind: 'personpost', slug: person.slug }}
          className={styles.row}
        >
          <Row title={person.name} sub={person.years} />
        </ToLink>
      ))}
    </Section>
  )
}

/**
 * The library's landing page (library.md) — the deliberate entry to
 * exploration. Secondary to the reading room; calm, finite, without engagement metrics.
 * Traditions and sources stand at the top as the library's calm frame (editor's
 * decision 2026-07-18). The themes, rooms and questions sections are hidden from
 * the landing (editor's decision 2026-07-21); the entries live on via their routes,
 * themes still reach their rooms, and search still finds them. Saved is reached via the nav tab.
 */
export const LibraryHomePage = () => {
  useDocumentTitle('Biblioteket')
  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <h1 className={styles.title}>Biblioteket</h1>
      <p className={styles.lede}>
        För den som vill leta vidare på egen hand — bland traditioner, källor och vandringar.
                    </p>
      <Link to="/bibliotek/sok" className={styles.searchEntry}>
        Sök efter en fråga, tanke eller källa
                    </Link>
      <Traditionssektion />
      <SourceSection />
      <PathSection />
      <Personsektion />
    </div>
  )
}
