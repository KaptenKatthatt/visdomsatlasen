// Små byggstenar som bibliotekets sidor delar: sidhuvudet, sektionsrubriken,
// radinnehållet, beskrivningsprosan och rumslistan. Länken runt en rad
// varierar (statisk route eller ToLink).
import type { ReactNode } from 'react'
import { RumRad } from '../../components/RumRad'
import type { Rum } from '../../content/redaktion/schema'
import { stycken } from '../../lib/innehall'
import styles from './Bibliotek.module.css'

export const rumsantal = (antal: number): string => (antal === 1 ? 'Ett rum' : `${antal} rum`)

/** Undersidornas huvud. Poster som inte är publicerade märks »Utkast« —
 * de nås bara via direkt länk och är redaktionens granskningsvy. */
export const Sidhuvud = ({
  kicker,
  titel,
  status,
  children,
}: {
  kicker: string
  titel: string
  status?: Rum['status']
  children?: ReactNode
}) => (
  <header className={styles.huvud}>
    <div className="kicker">
      {kicker}
      {status !== undefined && status !== 'publicerad' && ' · Utkast'}
    </div>
    <h1 className={styles.huvudTitel}>{titel}</h1>
    {children}
  </header>
)

export const Beskrivning = ({ text }: { text?: string }) => (
  <>
    {text !== undefined &&
      stycken(text).map((stycke, i) => (
        <p key={i} className={styles.beskrivning}>
          {stycke}
        </p>
      ))}
  </>
)

export const Rumslista = ({ rum, tomtBesked }: { rum: Rum[]; tomtBesked: string }) => (
  <>
    {rum.length === 0 ? (
      <p className={styles.tomt}>{tomtBesked}</p>
    ) : (
      rum.map((ettRum) => <RumRad key={ettRum.id} rum={ettRum} />)
    )}
  </>
)

export const Rad = ({ titel, sub }: { titel: string; sub?: string }) => (
  <>
    <span>
      <span className={styles.radTitel}>{titel}</span>
      {sub !== undefined && <span className={styles.radSub}>{sub}</span>}
    </span>
    <span className={styles.chev}>›</span>
  </>
)

export const Sektion = ({ rubrik, children }: { rubrik: string; children: ReactNode }) => (
  <div className={styles.sektion}>
    <div className="kicker sectionKicker">{rubrik}</div>
    {children}
  </div>
)
