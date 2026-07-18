import { Link } from '@tanstack/react-router'
import { ToLink } from '../../components/ToLink'
import {
  libraryQuestions,
  libraryPeople,
  librarySources,
  libraryRooms,
  libraryThemes,
  libraryTraditions,
  libraryPaths,
  roomsForPath,
  pathReadingTime,
} from '../../lib/library'
import { useSidtitel } from '../../lib/useSidtitel'
import {
  allQuestions,
  allSources,
  allPeople,
  allRooms,
  allThemes,
  allTraditions,
  allPaths,
  sourceName,
} from '../../lib/content'
import { valbaraRoom } from '../../lib/roomSelection'
import styles from './Bibliotek.module.css'
import { questionCount, Row, roomCount, Section } from './Biblioteksdelar'

// The questions are gathered behind a single entry (like the rooms) — the whole list lives on
// the subpage, so the landing page stays short and calm (library.md).
const Fragesektion = () => (
  <Section rubrik="Frågor">
    <Link to="/bibliotek/fragor" className={styles.row}>
      <Row title="Alla frågor" sub={questionCount(libraryQuestions(allQuestions).length)} />
    </Link>
  </Section>
)

const Temasektion = () => {
  const themes = libraryThemes(allThemes)
  return (
    <Section rubrik="Teman">
      {themes.length === 0 ? (
        <p className={styles.empty}>Inga teman ännu.</p>
      ) : (
        themes.map((theme) => (
          <ToLink key={theme.id} to={{ kind: 'tema', slug: theme.slug }} className={styles.row}>
            <Row title={theme.label} sub={roomCount(valbaraRoom(theme.id, allRooms).length)} />
          </ToLink>
        ))
      )}
    </Section>
  )
}

// Paths are an optional, quiet entry (paths.md, Discoverability) — they
// must not stand as an empty, promising section, so it's hidden until published
// paths exist (the same discipline as the traditions). Drafts are reviewed via
// a direct link.
const Vandringssektion = () => {
  const paths = libraryPaths(allPaths)
  if (paths.length === 0) return null
  return (
    <Section rubrik="Vandringar">
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

const RoomSection = () => (
  <Section rubrik="Rum">
    <Link to="/bibliotek/rum" className={styles.row}>
      <Row title="Alla rum" sub={roomCount(libraryRooms(allRooms).length)} />
    </Link>
  </Section>
)

const SourceSection = () => (
  <Section rubrik="Källor">
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
    <Section rubrik="Traditioner">
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
    <Section rubrik="Personer">
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
 * decision 2026-07-18), the questions gathered at the bottom. Saved is reached via the nav tab.
 */
export const BibliotekHemPage = () => {
  useSidtitel('Biblioteket')
  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <h1 className={styles.title}>Biblioteket</h1>
      <p className={styles.lede}>
        För den som vill leta vidare på egen hand — bland traditioner, källor, teman och frågor.
                    </p>
      <Link to="/bibliotek/sok" className={styles.searchEntry}>
        Sök efter en fråga, tanke eller källa
                    </Link>
      <Traditionssektion />
      <SourceSection />
      <Temasektion />
      <Vandringssektion />
      <RoomSection />
      <Fragesektion />
      <Personsektion />
    </div>
  )
}
