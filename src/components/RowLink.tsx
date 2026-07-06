import type { To } from '../content/model'
import { ToLink } from './ToLink'
import styles from './RowLink.module.css'

type Props = {
  to: To
  title: string
  sub?: string
  subItalic?: boolean
  chevron?: boolean
  size?: 'sm' | 'base' | 'md' | 'lg'
}

/** The recurring hairline list row: title, soft subline, optional chevron. */
export const RowLink = ({ to, title, sub, subItalic, chevron, size = 'base' }: Props) => (
  <ToLink to={to} className={`${styles.row} ${styles[size] ?? ''}`}>
    <span>
      <span className={styles.title} style={{ display: 'block' }}>
        {title}
      </span>
      {sub !== undefined && (
        <span
          className={subItalic ? `${styles.sub} ${styles.subItalic}` : styles.sub}
          style={{ display: 'block' }}
        >
          {sub}
        </span>
      )}
    </span>
    {chevron && <span className={styles.chev}>›</span>}
  </ToLink>
)
