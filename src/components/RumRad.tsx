import type { Room } from '../content/editorial/schema'
import { hittaTema } from '../lib/innehall'
import { ToLink } from './ToLink'
import styles from './RumRad.module.css'

/** Rumsförhandsvisning i biblioteket (library.md, Reflection Rooms): title,
 * kort summary, tema och ungefärlig lästid. Inget mer — inga mått,
 * ingen brådska. Länken öppnar rummet i läsrumsläge. */
export const RumRad = ({ rum }: { rum: Room }) => {
  const tema = hittaTema(rum.themes[0] ?? '')
  const meta = [tema?.label, `${rum.readingTimeMinutes} min`].filter(Boolean).join(' · ')
  return (
    <ToLink to={{ kind: 'rum', slug: rum.slug }} className={styles.rad}>
      <span className={styles.title}>{rum.title}</span>
      <span className={styles.summary}>{rum.summary}</span>
      <span className={styles.meta}>{meta}</span>
    </ToLink>
  )
}
