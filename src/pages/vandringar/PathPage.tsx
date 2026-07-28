import { Link } from '@tanstack/react-router'
import { TopBar } from '../../components/TopBar'
import { Trail } from '../../components/Trail'
import type { Room, Path } from '../../content/editorial/schema'
import { roomsForPath } from '../../lib/library'
import { allRooms, findPathBySlug, paragraphs } from '../../lib/content'
import { NotFoundNote } from '../NotFoundNote'
import { CentralQuestion } from './CentralQuestion'
import styles from './Path.module.css'
import { Sidhuvud } from '../bibliotek/LibraryParts'

/** The head of the trail: what the path is and why the rooms belong together.
 * A little air after the prose, then the ··· — and under it the trail starts
 * straight away. No screen of its own: the reader should see the walk begin
 * without having to scroll for it. */
const Trailhead = ({ path }: { path: Path }) => (
  <section className={styles.trailhead}>
    <Sidhuvud kicker="Vandring" title={path.title} status={path.status} />
    {paragraphs(path.introduction).map((paragraph, i) => (
      <p key={i} className={styles.intro}>
        {paragraph}
      </p>
    ))}
    <div className={`dots ${styles.pause}`}>···</div>
  </section>
)

/** The stops as places along a trail, not tasks (paths.md, Path Overview). Each
 * one carries its own thought — the room's summary — so the walk is a sequence of
 * things to think about rather than a schedule to read off. No reading times, no
 * chevrons, no footer: the page ends where the trail ends. The sequence lives in
 * the `<ol>`, so it survives when the visual design is removed (Accessibility);
 * the trail line and its markers are pseudo-elements only. Every row opens the
 * path's reading flow at that stop (the room's slug as hash) — the path is read
 * as one continuous scroll, never room by room. */
const Stops = ({ path, rooms }: { path: Path; rooms: Room[] }) => {
  if (rooms.length === 0)
    return <p className={styles.empty}>Den här vandringen har inga rum ännu.</p>
  return (
    <Trail className={styles.trail}>
      {rooms.map((room) => (
        <li key={room.id} className={styles.stop}>
          <Link
            to="/vandring/$slug/las"
            params={{ slug: path.slug }}
            hash={room.slug}
            className={styles.stopLink}
          >
            <span className={styles.stopTitle}>{room.title}</span>
            <span className={styles.stopSummary}>{room.summary}</span>
          </Link>
        </li>
      ))}
    </Trail>
  )
}

/** The path's overview (paths.md, Path Overview) as a walk rather than a table of
 * contents: the head of the trail, a pause, the trail itself, and last of all the
 * central question — the page reads in the order one walks it, and ends on the
 * thought one carries away. Nothing reads as a syllabus, and there are no
 * progress metrics — no reading times, no totals, no traditions, no »Fortsätt
 * där du stannade« (editor's decision 2026-07-26; the remembered room lives on in
 * Sparat, where it is orientation for returning, not a cue on the trail itself).
 * The path is read in its own flow (PathReadPage), as one continuous scroll —
 * here you only choose where to step in. TopBar without onBack ⇒ history step
 * back, so the previous location is preserved. */
export const PathPage = ({ slug }: { slug: string }) => {
  const path = findPathBySlug(slug)
  if (!path) return <NotFoundNote subject="Vandringen" />
  return (
    <div className="screenSub">
      <TopBar />
      <Trailhead path={path} />
      <Stops path={path} rooms={roomsForPath(path, allRooms)} />
      <CentralQuestion path={path} />
    </div>
  )
}
