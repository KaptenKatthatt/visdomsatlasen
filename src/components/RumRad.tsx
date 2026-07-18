import type { Room } from '../content/editorial/schema'
import { findTheme } from '../lib/content'
import { ToLink } from './ToLink'
import styles from './RumRad.module.css'

/** Room preview in the library (library.md, Reflection Rooms): title,
 * short summary, theme and approximate reading time. Nothing more — no metrics,
 * no rush. The link opens the room in reading-room mode. */
export const RoomRow = ({ rum }: { rum: Room }) => {
  const theme = findTheme(rum.themes[0] ?? '')
  const meta = [theme?.label, `${rum.readingTimeMinutes} min`].filter(Boolean).join(' · ')
  return (
    <ToLink to={{ kind: 'rum', slug: rum.slug }} className={styles.row}>
      <span className={styles.title}>{rum.title}</span>
      <span className={styles.summary}>{rum.summary}</span>
      <span className={styles.meta}>{meta}</span>
    </ToLink>
  )
}
