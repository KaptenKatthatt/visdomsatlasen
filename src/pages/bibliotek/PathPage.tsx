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
import styles from './Library.module.css'
import { Description, Row, Section, Sidhuvud } from './LibraryParts'

/** A quiet orientation row: the path's traditions followed by an approximate
 * total reading time (paths.md, Path Overview — sources are shown discreetly, the time
 * is approximate and never a goal). */
const Metarad = ({ rooms }: { rooms: Room[] }) => {
  const traditions = traditionsForPath(rooms, allSources, allTraditions)
  const parts = [
    ...traditions.map((tradition) => tradition.name),
    `ca ${pathReadingTime(rooms)} min sammanlagt`,
  ]
  return <p className={styles.antal}>{parts.join(' · ')}</p>
}

/** A quiet save control (notes-and-saved.md, Saving): »Spara«/»Sparad«,
 * no celebratory feedback, no counter. A saved path only means
 * the reader wants to be able to return — never a commitment to finish. */
const SavePath = ({ path }: { path: Path }) => {
  const { savedPaths, toggleSavedPath } = useAtlas()
  const saved = !!savedPaths[path.id]
  return (
    <div className={styles.save}>
      <button
        type="button"
        className={styles.saveButton}
        aria-pressed={saved}
        onClick={() => toggleSavedPath(path.id)}
      >
        {saved ? 'Sparad' : 'Spara'}
      </button>
    </div>
  )
}

/** The central question — the heart of the path. Shown only when it's published;
 * otherwise the draft question is reached via the library, not from here. */
const Fragedel = ({ path }: { path: Path }) => {
  const [question] = publishedThrough([path.centralQuestion], findQuestion)
  if (!question) return null
  return (
    <Section heading="Fråga">
      <ToLink to={{ kind: 'fraga', slug: question.slug }} className={styles.row}>
        <Row title={question.text} />
      </ToLink>
    </Section>
  )
}

/** The rooms as places along a path, not tasks (paths.md, Path Overview).
 * A semantically ordered list (`<ol>`) carries the sequence without visual arrows
 * (Accessibility). Each row opens the room with the path as context. A
 * neutral »Fortsätt där du stannade« is placed at the top if a room is remembered — only
 * orientation, never progress. */
const RoomPart = ({ path, rooms }: { path: Path; rooms: Room[] }) => {
  const { pathPositions } = useAtlas()
  const place = rooms.find((room) => room.id === pathPositions[path.id])
  return (
    <Section heading="Rummen">
      {place && (
        <Link
          to="/rum/$slug"
          params={{ slug: place.slug }}
          search={{ vandring: path.slug }}
          className={styles.row}
        >
          <Row title="Fortsätt där du stannade" sub={place.title} />
        </Link>
      )}
      {rooms.length === 0 ? (
        <p className={styles.empty}>Den här vandringen har inga rum ännu.</p>
      ) : (
        <ol className={styles.pathList}>
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                to="/rum/$slug"
                params={{ slug: room.slug }}
                search={{ vandring: path.slug }}
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
export const PathPage = ({ slug }: { slug: string }) => {
  const path = findPathBySlug(slug)
  if (!path) return <NotFoundNote subject="Vandringen" />
  const rooms = roomsForPath(path, allRooms)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Vandring" title={path.title} status={path.status} />
      <Metarad rooms={rooms} />
      <SavePath path={path} />
      <Description text={path.introduction} />
      <Fragedel path={path} />
      <RoomPart path={path} rooms={rooms} />
    </div>
  )
}
