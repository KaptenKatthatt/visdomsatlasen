// Building blocks for the Saved surface (notes-and-saved.md): preview cards, empty state and
// groups. The cards show only restrained metadata — never progress, completion,
// popularity or visit counts.
import type { ReactNode } from 'react'
import { ToLink } from '../components/ToLink'
import type { Path } from '../content/editorial/schema'
import { findTopic } from '../content/topics'
import { findRoomById } from '../lib/content'
import { dateLabel, utdrag, type Note } from '../lib/personal'
import styles from './SparatDelar.module.css'

/** Where a note links back to: the reading room (rum) or the topic essay. A
 * subset of `To` — local so the Saved surface avoids co-importing the old
 * app types (model.ts) together with the editorial schema. */
export type NoteringsMal =
  | { kind: 'rum'; slug: string }
  | { kind: 'las'; id: string; mode: 'essa' }

/** A note card's data: title, text, date and an optional origin target. */
export type Kort = {
  key: string
  title: string
  text: string
  datum: string | undefined
  to: NoteringsMal | undefined
}

// The note tied to its origin (spec Notes and Sources): rooms link
// to the reading room, topic notes to the essay. If the origin isn't found the
// text still renders — without a link, but never hidden. Shared by Saved and search.
export const noteToCard = (anteckning: Note): Kort => {
  const datum = dateLabel(anteckning.updated)
  const bas = { key: anteckning.originId, text: anteckning.text, datum }
  if (anteckning.originType === 'room') {
    const room = findRoomById(anteckning.originId)
    const to = room ? ({ kind: 'rum', slug: room.slug } as const) : undefined
    return { ...bas, title: room?.title ?? 'Sparad tanke', to }
  }
  const topic = findTopic(anteckning.originId)
  const to = topic ? ({ kind: 'las', id: topic.id, mode: 'essa' } as const) : undefined
  return { ...bas, title: topic?.title ?? 'Sparad tanke', to }
}

/** A group is shown only when it has content (spec Saved Section). */
export const Group = ({ rubrik, children }: { rubrik: string; children: ReactNode }) => (
  <section className={styles.grupp}>
    <h2 className="kicker sectionKicker">{rubrik}</h2>
    {children}
  </section>
)

/** The path's preview card: title, short introduction and — only for
 * orientation — the last-opened room. Never room count, percentage or remaining
 * (spec Saved Paths). */
export const PathCard = ({
  vandring,
  senastRum,
}: {
  vandring: Path
  senastRum: string | undefined
}) => (
  <ToLink to={{ kind: 'vandring', slug: vandring.slug }} className={styles.card}>
    <span className={styles.cardTitle}>{vandring.title}</span>
    <span className={styles.cardText}>{utdrag(vandring.introduction, 96)}</span>
    {senastRum !== undefined && <span className={styles.cardMeta}>Senast: {senastRum}</span>}
  </ToLink>
)

/** The note's preview card: excerpt, linked title and date. Links to
 * the origin when it can be resolved; otherwise the text renders without a link — a
 * note is never hidden just because its origin can't be found. */
export const NoteCard = ({
  title,
  text,
  datum,
  to,
}: {
  title: string
  text: string
  datum: string | undefined
  to: NoteringsMal | undefined
}) => {
  const innehåll = (
    <>
      <span className={styles.noteTitle}>{title}</span>
      <span className={styles.noteExcerpt}>»{utdrag(text)}«</span>
      {datum !== undefined && <span className={styles.noteMeta}>{datum}</span>}
    </>
  )
  if (to === undefined) return <div className={styles.note}>{innehåll}</div>
  return (
    <ToLink to={to} className={styles.note}>
      {innehåll}
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
