import { Link } from '@tanstack/react-router'
import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import type { Room, Path } from '../../content/editorial/schema'
import {
  publishedThrough,
  roomsForPath,
  traditionsForPath,
  pathReadingTime,
} from '../../lib/library'
import {
  allSources,
  allRooms,
  allTraditions,
  findQuestion,
  findPathBySlug,
} from '../../lib/content'
import { useAtlas } from '../../lib/store'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Row, Section, Sidhuvud } from './Biblioteksdelar'

/** A quiet orientation row: the path's traditions followed by an approximate
 * total reading time (paths.md, Path Overview — sources are shown discreetly, the time
 * is approximate and never a goal). */
const Metarad = ({ rummen }: { rummen: Room[] }) => {
  const traditions = traditionsForPath(rummen, allSources, allTraditions)
  const delar = [
    ...traditions.map((tradition) => tradition.name),
    `ca ${pathReadingTime(rummen)} min sammanlagt`,
  ]
  return <p className={styles.antal}>{delar.join(' · ')}</p>
}

/** A quiet save control (notes-and-saved.md, Saving): »Spara«/»Sparad«,
 * no celebratory feedback, no counter. A saved path only means
 * the reader wants to be able to return — never a commitment to finish. */
const SavePath = ({ vandring }: { vandring: Path }) => {
  const { savedPaths, toggleSavedPath } = useAtlas()
  const saved = !!savedPaths[vandring.id]
  return (
    <div className={styles.save}>
      <button
        type="button"
        className={styles.saveButton}
        aria-pressed={saved}
        onClick={() => toggleSavedPath(vandring.id)}
      >
        {saved ? 'Sparad' : 'Spara'}
      </button>
    </div>
  )
}

/** The central question — the heart of the path. Shown only when it's published;
 * otherwise the draft question is reached via the library, not from here. */
const Fragedel = ({ vandring }: { vandring: Path }) => {
  const [fråga] = publishedThrough([vandring.centralQuestion], findQuestion)
  if (!fråga) return null
  return (
    <Section rubrik="Fråga">
      <ToLink to={{ kind: 'fraga', slug: fråga.slug }} className={styles.row}>
        <Row title={fråga.text} />
      </ToLink>
    </Section>
  )
}

/** The rooms as places along a path, not tasks (paths.md, Path Overview).
 * A semantically ordered list (`<ol>`) carries the sequence without visual arrows
 * (Accessibility). Each row opens the room with the path as context. A
 * neutral »Fortsätt där du stannade« is placed at the top if a room is remembered — only
 * orientation, never progress. */
const RoomPart = ({ vandring, rummen }: { vandring: Path; rummen: Room[] }) => {
  const { pathPositions } = useAtlas()
  const place = rummen.find((room) => room.id === pathPositions[vandring.id])
  return (
    <Section rubrik="Rummen">
      {place && (
        <Link
          to="/rum/$slug"
          params={{ slug: place.slug }}
          search={{ vandring: vandring.slug }}
          className={styles.row}
        >
          <Row title="Fortsätt där du stannade" sub={place.title} />
        </Link>
      )}
      {rummen.length === 0 ? (
        <p className={styles.empty}>Den här vandringen har inga rum ännu.</p>
      ) : (
        <ol className={styles.pathList}>
          {rummen.map((room) => (
            <li key={room.id}>
              <Link
                to="/rum/$slug"
                params={{ slug: room.slug }}
                search={{ vandring: vandring.slug }}
                className={styles.row}
              >
                <Row title={room.title} sub={`${room.readingTimeMinutes} min`} />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Section>
  )
}

/** The path's overview (paths.md, Path Overview): title, quiet metadata,
 * introduction, central question and the rooms in editorial order. No
 * syllabus feel, no progress metrics. The path is read in the reading room, one room at
 * a time — here you only choose where to step in. TopBar without onBack ⇒
 * history step back, so the library location is preserved. */
export const VandringPage = ({ slug }: { slug: string }) => {
  const path = findPathBySlug(slug)
  if (!path) return <NotFoundNote subject="Vandringen" />
  const rooms = roomsForPath(path, allRooms)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Vandring" title={path.title} status={path.status} />
      <Metarad rummen={rooms} />
      <SavePath vandring={path} />
      <Beskrivning text={path.introduction} />
      <Fragedel vandring={path} />
      <RoomPart vandring={path} rummen={rooms} />
    </div>
  )
}
