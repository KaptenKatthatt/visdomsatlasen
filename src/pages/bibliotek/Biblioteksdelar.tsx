// Small building blocks that the library's pages share: the page header, the section heading,
// the row content, the description prose and the room list. The link around a row
// varies (static route or ToLink).
import type { ReactNode } from 'react'
import { RoomRow } from '../../components/RumRad'
import type { Room } from '../../content/editorial/schema'
import { paragraphs } from '../../lib/content'
import { useSidtitel } from '../../lib/useSidtitel'
import styles from './Bibliotek.module.css'

export const roomCount = (antal: number): string => (antal === 1 ? 'Ett rum' : `${antal} rum`)

export const questionCount = (antal: number): string =>
  antal === 1 ? 'En fråga' : `${antal} frågor`

/** The subpages' header. Entries that aren't published are marked »Utkast« —
 * they're reached only via a direct link and are the editorial review view.
 * The header's title also becomes the document title — the header is by definition
 * the page's main heading, so every subpage gets the right tab name for free. */
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
    <header className={styles.head}>
      <div className="kicker">
        {kicker}
        {status !== undefined && status !== 'published' && ' · Utkast'}
      </div>
      <h1 className={styles.headTitle}>{title}</h1>
      {children}
    </header>
  )
}

export const Beskrivning = ({ text }: { text?: string }) => (
  <>
    {text !== undefined &&
      paragraphs(text).map((paragraph, i) => (
        <p key={i} className={styles.description}>
          {paragraph}
        </p>
      ))}
  </>
)

export const RoomList = ({ rum, tomtBesked }: { rum: Room[]; tomtBesked: string }) => (
  <>
    {rum.length === 0 ? (
      <p className={styles.empty}>{tomtBesked}</p>
    ) : (
      rum.map((room) => <RoomRow key={room.id} rum={room} />)
    )}
  </>
)

export const Row = ({ title, sub }: { title: string; sub?: string }) => (
  <>
    <span>
      <span className={styles.rowTitle}>{title}</span>
      {sub !== undefined && <span className={styles.rowSub}>{sub}</span>}
    </span>
    <span className={styles.chev}>›</span>
  </>
)

export const Section = ({ rubrik, children }: { rubrik: string; children: ReactNode }) => (
  <div className={styles.section}>
    <h2 className="kicker sectionKicker">{rubrik}</h2>
    {children}
  </div>
)
