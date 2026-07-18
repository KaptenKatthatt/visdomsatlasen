// Byggstenar för Sparat-ytan (notes-and-saved.md): preview-kort, tomläge och
// grupper. Korten visar bara restrained metadata — aldrig förlopp, completion,
// popularitet eller besöksantal.
import type { ReactNode } from 'react'
import { ToLink } from '../components/ToLink'
import type { Vandring } from '../content/editorial/schema'
import { findTopic } from '../content/topics'
import { hittaRumViaId } from '../lib/innehall'
import { datumEtikett, utdrag, type Anteckning } from '../lib/personligt'
import styles from './SparatDelar.module.css'

/** Dit en anteckning länkar tillbaka: läsrummet (rum) eller topic-essän. En
 * delmängd av `To` — lokal så Sparat-ytan slipper co-importera de gamla
 * app-typerna (model.ts) tillsammans med redaktionsschemat. */
export type NoteringsMal =
  | { kind: 'rum'; slug: string }
  | { kind: 'las'; id: string; mode: 'essa' }

/** Ett anteckningskorts data: title, text, datum och ett valfritt ursprungsmål. */
export type Kort = {
  key: string
  title: string
  text: string
  datum: string | undefined
  to: NoteringsMal | undefined
}

// Anteckningen kopplad till sitt ursprung (spec Notes and Sources): rum länkas
// till läsrummet, topic-anteckningar till essän. Hittas inte ursprunget renderas
// texten ändå — utan länk, men aldrig gömd. Delas av Sparat och söket.
export const anteckningTillKort = (anteckning: Anteckning): Kort => {
  const datum = datumEtikett(anteckning.updated)
  const bas = { key: anteckning.ursprungId, text: anteckning.text, datum }
  if (anteckning.ursprungTyp === 'rum') {
    const rum = hittaRumViaId(anteckning.ursprungId)
    const to = rum ? ({ kind: 'rum', slug: rum.slug } as const) : undefined
    return { ...bas, title: rum?.title ?? 'Sparad tanke', to }
  }
  const topic = findTopic(anteckning.ursprungId)
  const to = topic ? ({ kind: 'las', id: topic.id, mode: 'essa' } as const) : undefined
  return { ...bas, title: topic?.title ?? 'Sparad tanke', to }
}

/** En grupp visas bara när den har innehåll (spec Saved Section). */
export const Grupp = ({ rubrik, children }: { rubrik: string; children: ReactNode }) => (
  <section className={styles.grupp}>
    <h2 className="kicker sectionKicker">{rubrik}</h2>
    {children}
  </section>
)

/** Vandringens preview-kort: title, kort introduction och — bara för
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
    <span className={styles.kortTitel}>{vandring.title}</span>
    <span className={styles.kortText}>{utdrag(vandring.introduction, 96)}</span>
    {senastRum !== undefined && <span className={styles.kortMeta}>Senast: {senastRum}</span>}
  </ToLink>
)

/** Anteckningens preview-kort: utdrag, kopplad title och datum. Länkar till
 * ursprunget när det kan slås upp; annars renderas texten utan länk — en
 * anteckning göms aldrig bara för att dess ursprung inte hittas. */
export const AnteckningsKort = ({
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
      <span className={styles.noteTitel}>{title}</span>
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
