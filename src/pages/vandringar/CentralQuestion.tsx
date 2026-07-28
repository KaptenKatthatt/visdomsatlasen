import { ToLink } from '../../components/ToLink'
import type { Path } from '../../content/editorial/schema'
import { findQuestion } from '../../lib/content'
import { publishedThrough } from '../../lib/library'
import styles from './Path.module.css'

/** The path's central question as its last word — on the anteroom after the
 * stops, in the flow after the closing reflection. It is the thought one leaves
 * with rather than an introduction to what follows, so nothing stands below it.
 * The question links to its own page when published; a draft question is
 * reached via the library, not from here. Shared by both surfaces so the two
 * never drift apart. */
export const CentralQuestion = ({ path }: { path: Path }) => {
  const [question] = publishedThrough([path.centralQuestion], findQuestion)
  if (!question) return null
  return (
    <p className={styles.question}>
      <ToLink to={{ kind: 'fraga', slug: question.slug }} className={styles.questionLink}>
        {question.text}
      </ToLink>
    </p>
  )
}
