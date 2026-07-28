// Building blocks for the Saved surface (notes-and-saved.md): preview cards, empty state and
// groups. The cards show only restrained metadata — never progress, completion,
// popularity or visit counts.
import type { ReactNode } from 'react'
import { ToLink } from '../components/ToLink'
import type { Path } from '../content/editorial/schema'
import { findTopic } from '../content/topics'
import { findPathById, findRoomById } from '../lib/content'
import { dateLabel, excerpt, type Note, type Origin } from '../lib/personal'
import styles from './SavedParts.module.css'

/** Where a note links back to: the reading room (rum), a path's anteroom or the
 * topic essay. A subset of `To` — local so the Saved surface avoids
 * co-importing the old app types (model.ts) together with the editorial schema. */
export type NoteringsMal =
  | { kind: 'rum'; slug: string }
  | { kind: 'vandring'; slug: string }
  | { kind: 'las'; id: string; mode: 'essa' }

/** A note card's data: title, text, date and an optional origin target. */
export type Card = {
  key: string
  title: string
  text: string
  date: string | undefined
  to: NoteringsMal | undefined
}

type NoteOrigin = { title: string; to: NoteringsMal }

// Where each kind of note came from (spec Notes and Sources): rooms lead back to
// the reading room, path notes — written at the end of a path's reading flow —
// to the path's anteroom, topic notes to the essay. One entry per origin, so a
// new origin is one line here rather than another branch.
const ORIGIN: Record<Origin, (id: string) => NoteOrigin | undefined> = {
  room: (id) => {
    const room = findRoomById(id)
    return room && { title: room.title, to: { kind: 'rum', slug: room.slug } }
  },
  path: (id) => {
    const path = findPathById(id)
    return path && { title: path.title, to: { kind: 'vandring', slug: path.slug } }
  },
  topic: (id) => {
    const topic = findTopic(id)
    return topic && { title: topic.title, to: { kind: 'las', id: topic.id, mode: 'essa' } }
  },
}

// The note tied to its origin. If the origin can't be resolved the text still
// renders — without a title or link, but never hidden. Shared by Saved and search.
export const noteToCard = (note: Note): Card => {
  const origin = ORIGIN[note.originType](note.originId)
  return {
    key: note.originId,
    text: note.text,
    date: dateLabel(note.updated),
    title: origin?.title ?? 'Sparad tanke',
    to: origin?.to,
  }
}

/** A group is shown only when it has content (spec Saved Section). */
export const Group = ({ heading, children }: { heading: string; children: ReactNode }) => (
  <section className={styles.grupp}>
    <h2 className="kicker sectionKicker">{heading}</h2>
    {children}
  </section>
)

/** The path's preview card: title, short introduction and — only for
 * orientation — the last-opened room. Never room count, percentage or remaining
 * (spec Saved Paths). */
export const PathCard = ({
  path,
  recentRoom,
}: {
  path: Path
  recentRoom: string | undefined
}) => (
  <ToLink to={{ kind: 'vandring', slug: path.slug }} className={styles.card}>
    <span className={styles.cardTitle}>{path.title}</span>
    <span className={styles.cardText}>{excerpt(path.introduction, 96)}</span>
    {recentRoom !== undefined && <span className={styles.cardMeta}>Senast: {recentRoom}</span>}
  </ToLink>
)

/** The note's preview card: excerpt, linked title and date. Links to
 * the origin when it can be resolved; otherwise the text renders without a link — a
 * note is never hidden just because its origin can't be found. */
export const NoteCard = ({
  title,
  text,
  date,
  to,
}: {
  title: string
  text: string
  date: string | undefined
  to: NoteringsMal | undefined
}) => {
  const content = (
    <>
      <span className={styles.noteTitle}>{title}</span>
      <span className={styles.noteExcerpt}>»{excerpt(text)}«</span>
      {date !== undefined && <span className={styles.noteMeta}>{date}</span>}
    </>
  )
  if (to === undefined) return <div className={styles.note}>{content}</div>
  return (
    <ToLink to={to} className={styles.note}>
      {content}
    </ToLink>
  )
}

/** The Saved surface's empty state (spec Empty State): calm and direct, no prompt
 * to build a collection. */
export const EmptyState = () => (
  <div className={styles.emptyState}>
    <p className={styles.emptyText}>Du har inte sparat något ännu.</p>
    <p className={styles.emptyHint}>När en text berör dig kan du lägga ett bokmärke här.</p>
  </div>
)
