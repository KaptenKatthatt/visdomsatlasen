// Små byggstenar som bibliotekets sidor delar: sidhuvudet, sektionsrubriken,
// radinnehållet, beskrivningsprosan och rumslistan. Länken runt en rad
// varierar (statisk route eller ToLink).
import type { ReactNode } from 'react'
import { RumRad } from '../../components/RumRad'
import type { Room } from '../../content/editorial/schema'
import { stycken } from '../../lib/innehall'
import { useSidtitel } from '../../lib/useSidtitel'
import styles from './Bibliotek.module.css'

export const rumsantal = (antal: number): string => (antal === 1 ? 'Ett rum' : `${antal} rum`)

export const frågeantal = (antal: number): string =>
  antal === 1 ? 'En fråga' : `${antal} frågor`

/** Undersidornas huvud. Poster som inte är publicerade märks »Utkast« —
 * de nås bara via direkt länk och är redaktionens granskningsvy.
 * Sidhuvudets title blir också dokumenttitel — sidhuvudet är per definition
 * sidans huvudrubrik, så alla undersidor får rätt fliknamn på köpet. */
export const Sidhuvud = ({
  kicker,
  title,
  status,
  children,
}: {
  kicker: string
  title: string
  status?: Room['status']
  children?: ReactNode
}) => {
  useSidtitel(title)
  return (
    <header className={styles.huvud}>
      <div className="kicker">
        {kicker}
        {status !== undefined && status !== 'publicerad' && ' · Utkast'}
      </div>
      <h1 className={styles.huvudTitel}>{title}</h1>
      {children}
    </header>
  )
}

export const Beskrivning = ({ text }: { text?: string }) => (
  <>
    {text !== undefined &&
      stycken(text).map((stycke, i) => (
        <p key={i} className={styles.description}>
          {stycke}
        </p>
      ))}
  </>
)

export const Rumslista = ({ rum, tomtBesked }: { rum: Room[]; tomtBesked: string }) => (
  <>
    {rum.length === 0 ? (
      <p className={styles.tomt}>{tomtBesked}</p>
    ) : (
      rum.map((ettRum) => <RumRad key={ettRum.id} rum={ettRum} />)
    )}
  </>
)

export const Rad = ({ title, sub }: { title: string; sub?: string }) => (
  <>
    <span>
      <span className={styles.radTitel}>{title}</span>
      {sub !== undefined && <span className={styles.radSub}>{sub}</span>}
    </span>
    <span className={styles.chev}>›</span>
  </>
)

export const Sektion = ({ rubrik, children }: { rubrik: string; children: ReactNode }) => (
  <div className={styles.sektion}>
    <h2 className="kicker sectionKicker">{rubrik}</h2>
    {children}
  </div>
)
