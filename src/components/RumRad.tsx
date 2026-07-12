import type { Rum } from '../content/redaktion/schema'
import { hittaTema } from '../lib/innehall'
import { ToLink } from './ToLink'
import styles from './RumRad.module.css'

/** Rumsförhandsvisning i biblioteket (library.md, Reflection Rooms): titel,
 * kort sammanfattning, tema och ungefärlig lästid. Inget mer — inga mått,
 * ingen brådska. Länken öppnar rummet i läsrumsläge. */
export const RumRad = ({ rum }: { rum: Rum }) => {
  const tema = hittaTema(rum.teman[0] ?? '')
  const meta = [tema?.etikett, `${rum.lästidMinuter} min`].filter(Boolean).join(' · ')
  return (
    <ToLink to={{ kind: 'rum', slug: rum.slug }} className={styles.rad}>
      <span className={styles.titel}>{rum.titel}</span>
      <span className={styles.sammanfattning}>{rum.sammanfattning}</span>
      <span className={styles.meta}>{meta}</span>
    </ToLink>
  )
}
