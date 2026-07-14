// Byggstenar för Sparat-ytan (notes-and-saved.md): preview-kort, tomläge och
// grupper. Korten visar bara restrained metadata — aldrig förlopp, completion,
// popularitet eller besöksantal.
import type { ReactNode } from 'react'
import { ToLink } from '../components/ToLink'
import type { Vandring } from '../content/redaktion/schema'
import { utdrag } from '../lib/personligt'
import styles from './SparatDelar.module.css'

/** Dit en anteckning länkar tillbaka: läsrummet (rum) eller topic-essän. En
 * delmängd av `To` — lokal så Sparat-ytan slipper co-importera de gamla
 * app-typerna (model.ts) tillsammans med redaktionsschemat. */
export type NoteringsMal =
  | { kind: 'rum'; slug: string }
  | { kind: 'las'; id: string; mode: 'essa' }

/** En grupp visas bara när den har innehåll (spec Saved Section). */
export const Grupp = ({ rubrik, children }: { rubrik: string; children: ReactNode }) => (
  <section className={styles.grupp}>
    <div className="kicker sectionKicker">{rubrik}</div>
    {children}
  </section>
)

/** Vandringens preview-kort: titel, kort introduktion och — bara för
 * orientering — senast öppnade rum. Aldrig antal rum, procent eller kvarvarande
 * (spec Saved Paths). */
export const VandringKort = ({
  vandring,
  senastRum,
}: {
  vandring: Vandring
  senastRum: string | undefined
}) => (
  <ToLink to={{ kind: 'vandring', slug: vandring.slug }} className={styles.kort}>
    <span className={styles.kortTitel}>{vandring.titel}</span>
    <span className={styles.kortText}>{utdrag(vandring.introduktion, 96)}</span>
    {senastRum !== undefined && <span className={styles.kortMeta}>Senast: {senastRum}</span>}
  </ToLink>
)

/** Anteckningens preview-kort: utdrag, kopplad titel och datum. Länkar till
 * ursprunget när det kan slås upp; annars renderas texten utan länk — en
 * anteckning göms aldrig bara för att dess ursprung inte hittas. */
export const AnteckningsKort = ({
  titel,
  text,
  datum,
  to,
}: {
  titel: string
  text: string
  datum: string | undefined
  to: NoteringsMal | undefined
}) => {
  const innehåll = (
    <>
      <span className={styles.noteTitel}>{titel}</span>
      <span className={styles.noteUtdrag}>»{utdrag(text)}«</span>
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

/** Sparat-ytans tomläge (spec Empty State): lugnt och direkt, ingen uppmaning
 * att bygga en samling. */
export const Tomlage = () => (
  <div className={styles.tomlage}>
    <p className={styles.tomText}>Du har inte sparat något ännu.</p>
    <p className={styles.tomHint}>När en text berör dig kan du lägga ett bokmärke här.</p>
  </div>
)
