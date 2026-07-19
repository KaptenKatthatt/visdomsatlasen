// Building blocks for the Saved surface (notes-and-saved.md): preview cards, empty state and
// groups. The cards show only restrained metadata — never progress, completion,
// popularity or visit counts.
import type { ReactNode } from 'react'
import { ToLink } from '../components/ToLink'
import type { Path } from '../content/editorial/schema'
import { findTopic } from '../content/topics'
import { findRoomById } from '../lib/content'
import { dateLabel, excerpt, type Note } from '../lib/personal'
import styles from './SavedParts.module.css'

/** Where a note links back to: the reading room (rum) or the topic essay. A
 * subset of `To` — local so the Saved surface avoids co-importing the old
 * app types (model.ts) together with the editorial schema. */
export type NoteringsMal =
  | { kind: 'rum'; slug: string }
  | { kind: 'las'; id: string; mode: 'essa' }

/** A note card's data: title, text, date and an optional origin target. */
export type Card = {
  key: string
  title: string
  text: string
  date: string | undefined
  to: NoteringsMal | undefined
}

// The note tied to its origin (spec Notes and Sources): rooms link
// to the reading room, topic notes to the essay. If the origin isn't found the
// text still renders — without a link, but never hidden. Shared by Saved and search.
export const noteToCard = (note: Note): Card => {
  const date = dateLabel(note.updated)
  const bas = { key: note.originId, text: note.text, date }
  if (note.originType === 'room') {
    const room = findRoomById(note.originId)
    const to = room ? ({ kind: 'rum', slug: room.slug } as const) : undefined
    return { ...bas, title: room?.title ?? 'Sparad tanke', to }
  }
  const topic = findTopic(note.originId)
  const to = topic ? ({ kind: 'las', id: topic.id, mode: 'essa' } as const) : undefined
  return { ...bas, title: topic?.title ?? 'Sparad tanke', to }
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
