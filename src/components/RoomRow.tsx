import type { Room } from '../content/editorial/schema'
import { findTheme } from '../lib/content'
import { ToLink } from './ToLink'
import styles from './RoomRow.module.css'

/** Room preview in the library (library.md, Reflection Rooms): title,
 * short summary, theme and approximate reading time. Nothing more — no metrics,
 * no rush. The link opens the room in reading-room mode. */
export const RoomRow = ({ room }: { room: Room }) => {
  const theme = findTheme(room.themes[0] ?? '')
  const meta = [theme?.label, `${room.readingTimeMinutes} min`].filter(Boolean).join(' · ')
  return (
    <ToLink to={{ kind: 'rum', slug: room.slug }} className={styles.row}>
      <span className={styles.title}>{room.title}</span>
      <span className={styles.summary}>{room.summary}</span>
      <span className={styles.meta}>{meta}</span>
    </ToLink>
  )
}
