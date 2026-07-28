import { Link, useRouterState } from '@tanstack/react-router'
import { Fragment, useEffect, useRef, useState, type RefObject } from 'react'
import { BackIcon } from '../../components/Icons'
import { NotesSheet } from '../../components/NotesSheet'
import { ReadingSettingsButton } from '../../components/ReadingSettingsButton'
import { RoomText } from '../../components/RoomText'
import type { Path, Room as RoomPost, Source } from '../../content/editorial/schema'
import { allRooms, findPathBySlug, findSource, paragraphs, workName } from '../../lib/content'
import { roomsForPath } from '../../lib/library'
import { useAtlas } from '../../lib/store'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { NotFoundNote } from '../NotFoundNote'
import { CentralQuestion } from './CentralQuestion'
import styles from './PathRead.module.css'

/** The rest between the flow's parts: a full screen height of empty paper with
 * the fold in the middle. The previous text is guaranteed out of view, and it
 * takes a moment to scroll through the silence before the next heading rises —
 * the pause is what makes the reading slow, not any control. */
const Rest = () => (
  <div className={styles.rest}>
    <span className="dots">···</span>
  </div>
)

/** The mute source line: the works' names only, in caps, per room. No
 * unfolding, no link — the source apparatus lives in the library, and the flow
 * must not offer a way out mid-reading. The name is the editorial one
 * (`workName`), so a title's explanatory gloss stays on the source page where
 * it belongs (editor's decision). */
const sourceLine = (room: RoomPost): string =>
  [
    ...new Set(
      room.sources
        .map((relation) => findSource(relation.source))
        .filter((source): source is Source => source !== undefined)
        .map(workName),
    ),
  ].join(' · ')

/** One room in the flow: its text, then the mute source line. `data-room`
 * marks it for the orientation memory; the room's slug is the anchor the
 * anteroom's stops open at. A draft room is labelled as such — the flow doubles
 * as the editor's review view. */
const Room = ({ room }: { room: RoomPost }) => {
  const sources = sourceLine(room)
  return (
    <article data-room={room.id}>
      <RoomText
        room={room}
        heading="h2"
        anchor={room.slug}
        {...(room.status === 'published' ? {} : { kicker: 'Utkast' })}
      />
      {sources !== '' && <p className={styles.sourceLine}>{sources}</p>}
    </article>
  )
}

/** The path's ending: the closing reflection, the central question as the last
 * thought, and a single »Skriv ner en tanke«. The note belongs to the path
 * (origin `path`), not to any one room. No congratulation, no progress metric —
 * feeling done and stopping halfway is as good an ending, so the end celebrates
 * nothing. */
const Ending = ({ path }: { path: Path }) => {
  const { notes, setNote, removeNote } = useAtlas()
  const [noteOpen, setNoteOpen] = useState(false)
  return (
    <section className={styles.ending}>
      {path.closingReflection !== undefined &&
        paragraphs(path.closingReflection).map((paragraph, i) => (
          <p key={i} className={styles.reflection}>
            {paragraph}
          </p>
        ))}
      <CentralQuestion path={path} />
      <div className={styles.noteRow}>
        <button type="button" className={styles.noteAction} onClick={() => setNoteOpen(true)}>
          Skriv ner en tanke
        </button>
      </div>
      {noteOpen && (
        <NotesSheet
          title={path.title}
          value={notes[path.id]?.text ?? ''}
          onChange={(text) => setNote('path', path.id, text)}
          onDelete={() => removeNote(path.id)}
          onClose={() => setNoteOpen(false)}
        />
      )}
    </section>
  )
}

/** Writes the path's orientation memory as the reader scrolls: the room whose
 * beginning last passed the top of the screen. Orientation only — »where was
 * I« in Sparat — never progress, and only for published content (paths.md: the
 * memory is orientation, never progress). Environments without
 * IntersectionObserver (jsdom) are left silent. */
const usePathPositionMemory = (
  container: RefObject<HTMLDivElement | null>,
  path: Path | undefined,
): void => {
  const { registerPathPosition } = useAtlas()
  const pathId = path?.status === 'published' ? path.id : undefined
  useEffect(() => {
    if (pathId === undefined) return
    if (typeof IntersectionObserver === 'undefined' || container.current === null) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const roomId = entry.target.getAttribute('data-room')
          if (roomId !== null) registerPathPosition(pathId, roomId)
        }
      },
      // The band is the screen's top fifth: a room is where you stand when its
      // text is at the top of the view, not when it peeks in at the bottom.
      { rootMargin: '0px 0px -80% 0px' },
    )
    for (const node of container.current.querySelectorAll('[data-room]')) observer.observe(node)
    return () => observer.disconnect()
  }, [container, pathId, registerPathPosition])
}

/** Opens the flow at a given stop: the anteroom's stop links carry the room's
 * slug as the hash, and the page places itself there straight away — no
 * animated jump, the reading should begin in stillness where one stepped on.
 * Reads the hash from the router, so returning to another stop through history
 * moves the page too. */
const useHashEntry = (): void => {
  const hash = useRouterState({ select: (s) => s.location.hash })
  useEffect(() => {
    if (hash === '') return
    document.getElementById(hash)?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [hash])
}

/** The path's own reading surface — »Den långsamma rullen« (paths.md): the
 * whole path as one slow, continuous reading. The trailhead (the introduction
 * lives in the anteroom), then the rooms in editorial order with a screen height
 * of silence between each, and last the ending. One goes on by reading on — no
 * taps or arrows between rooms, no save button in the flow. The bottom bar's
 * chevron always leads back to the anteroom, so one is never trapped in the
 * flow. The ending comes even when a path has no rooms yet: the walk ends where
 * the text ends, not conditionally on there having been one. */
export const PathReadPage = ({ slug }: { slug: string }) => {
  const container = useRef<HTMLDivElement | null>(null)
  const path = findPathBySlug(slug)
  usePathPositionMemory(container, path)
  useHashEntry()
  useDocumentTitle(path?.title)
  if (!path) return <NotFoundNote subject="Vandringen" />
  const rooms = roomsForPath(path, allRooms)
  return (
    <div ref={container} className={styles.screen}>
      <header className={styles.trailhead}>
        <div className="kicker">
          Vandring
          {path.status !== 'published' && ' · Utkast'}
        </div>
        <h1 className={styles.title}>{path.title}</h1>
      </header>
      {rooms.length === 0 && (
        <p className={styles.empty}>Den här vandringen har inga rum ännu.</p>
      )}
      {rooms.map((room) => (
        <Fragment key={room.id}>
          <Rest />
          <Room room={room} />
        </Fragment>
      ))}
      <Rest />
      <Ending path={path} />
      <nav aria-label="Vandringen" className={styles.bar}>
        <Link
          to="/vandring/$slug"
          params={{ slug: path.slug }}
          aria-label="Till vandringens översikt"
          className="iconBtn"
        >
          <BackIcon />
        </Link>
        <ReadingSettingsButton />
      </nav>
    </div>
  )
}
