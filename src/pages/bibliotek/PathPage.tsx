import { Link } from '@tanstack/react-router'
import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import type { Room, Path } from '../../content/editorial/schema'
import { publishedThrough, roomsForPath } from '../../lib/library'
import { allRooms, findQuestion, findPathBySlug, paragraphs } from '../../lib/content'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Path.module.css'
import { Sidhuvud } from './LibraryParts'

/** The head of the trail: what the path is, why the rooms belong together, and
 * last the central question — the thought carried into the walk. Owns its screen
 * the way the reading room's sections do, so the eye never meets a stop's text
 * before the reader chooses to go on. The question links to its own page when
 * published; a draft question is reached via the library, not from here. */
const Trailhead = ({ path }: { path: Path }) => {
  const [question] = publishedThrough([path.centralQuestion], findQuestion)
  return (
    <section className={styles.trailhead}>
      <Sidhuvud kicker="Vandring" title={path.title} status={path.status} />
      {paragraphs(path.introduction).map((paragraph, i) => (
        <p key={i} className={styles.intro}>
          {paragraph}
        </p>
      ))}
      {question && (
        <p className={styles.question}>
          <ToLink to={{ kind: 'fraga', slug: question.slug }} className={styles.questionLink}>
            {question.text}
          </ToLink>
        </p>
      )}
      <div className={`dots ${styles.pause}`}>···</div>
    </section>
  )
}

/** The stops as places along a trail, not tasks (paths.md, Path Overview). Each
 * one carries its own thought — the room's summary — so the walk is a sequence of
 * things to think about rather than a schedule to read off. No reading times, no
 * chevrons, no footer: the page ends where the trail ends. The sequence lives in
 * the `<ol>`, so it survives when the visual design is removed (Accessibility);
 * the trail line and its markers are pseudo-elements only. Every row opens the
 * room with the path as context.
 *
 * `role="list"` is not redundant here: `list-style: none` makes WebKit drop the
 * list semantics, and VoiceOver then stops announcing »lista, 4 objekt«. With the
 * rows, chevrons and reading times gone, this list is the only thing carrying the
 * sequence, so it has to survive the styling. */
const Trail = ({ path, rooms }: { path: Path; rooms: Room[] }) => {
  if (rooms.length === 0)
    return <p className={styles.empty}>Den här vandringen har inga rum ännu.</p>
  return (
    // Not redundant in practice: `list-style: none` makes WebKit drop the list
    // semantics, and VoiceOver stops announcing »lista, 4 objekt«.
    /* eslint-disable-next-line jsx-a11y/no-redundant-roles */
    <ol className={styles.trail} role="list">
      {rooms.map((room) => (
        <li key={room.id} className={styles.stop}>
          <Link
            to="/rum/$slug"
            params={{ slug: room.slug }}
            search={{ vandring: path.slug }}
            className={styles.stopLink}
          >
            <span className={styles.stopTitle}>{room.title}</span>
            <span className={styles.stopSummary}>{room.summary}</span>
          </Link>
        </li>
      ))}
    </ol>
  )
}

/** The path's overview (paths.md, Path Overview) as a walk rather than a table of
 * contents: the head of the trail owns the first screen, then the trail unrolls.
 * Nothing competes with the question, nothing reads as a syllabus, and there are
 * no progress metrics — no reading times, no totals, no traditions, no »Fortsätt
 * där du stannade« (editor's decision 2026-07-26; the remembered room lives on in
 * Sparat, where it is orientation for returning, not a cue on the trail itself).
 * The path is read in the reading room, one room at a time — here you only choose
 * where to step in. TopBar without onBack ⇒ history step back, so the library
 * location is preserved. */
export const PathPage = ({ slug }: { slug: string }) => {
  const path = findPathBySlug(slug)
  if (!path) return <NotFoundNote subject="Vandringen" />
  return (
    <div className="screenSub">
      <TopBar />
      <Trailhead path={path} />
      <Trail path={path} rooms={roomsForPath(path, allRooms)} />
    </div>
  )
}
