import type { Paragraph } from '../content/model'
import { ToLink } from './ToLink'
import styles from './LinkedParagraph.module.css'

/** Essay paragraph with inline links into the atlas. */
export const LinkedParagraph = ({ paragraph }: { paragraph: Paragraph }) => (
  <p className={styles.paragraph}>
    {paragraph.map((segment, index) =>
      typeof segment === 'string' ? (
        <span key={index}>{segment}</span>
      ) : (
        <ToLink key={index} to={segment.to} className={styles.link}>
          {segment.t}
        </ToLink>
      ),
    )}
  </p>
)
