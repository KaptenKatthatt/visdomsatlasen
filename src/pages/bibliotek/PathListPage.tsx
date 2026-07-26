import { ToLink } from '../../components/ToLink'
import type { Path } from '../../content/editorial/schema'
import { libraryPaths, publishedThrough } from '../../lib/library'
import { allPaths, findQuestion } from '../../lib/content'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import styles from './Path.module.css'

/** What the path asks — the one line that says what you would be thinking about.
 * The gate guarantees it for everything shown here: a published path may not link
 * an unpublished central question (validate.ts), and only published paths reach
 * this list. Nothing stands in if the reference ever drifts; a truncated piece of
 * prose would read as a question without being one. */
const centralQuestion = (path: Path): string | undefined =>
  publishedThrough([path.centralQuestion], findQuestion)[0]?.text

/** All published paths — several heads of trails, not a catalogue. The nav tab
 * »Vandringar« lands here, so the page carries its own screen (screenTab, no back
 * arrow). Each path shows only its title and its question: no counts, no reading
 * times, nothing that reads as a syllabus (paths.md, Discoverability — easy to
 * find, never promoted). Finite list, no infinite scroll. */
export const PathListPage = () => {
  const paths = libraryPaths(allPaths)
  useDocumentTitle('Vandringar')
  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <h1 className={styles.listTitle}>Vandringar</h1>
      <p className={styles.listLede}>
        Långsamma vägar genom flera rum. Ingenting brådskar.
      </p>
      <div className={styles.paths}>
        {paths.length === 0 ? (
          <p className={styles.empty}>Inga vandringar ännu.</p>
        ) : (
          paths.map((path) => (
            <div key={path.id} className={styles.path}>
              <ToLink to={{ kind: 'vandring', slug: path.slug }} className={styles.pathLink}>
                <span className={styles.pathTitle}>{path.title}</span>
                <span className={styles.pathQuestion}>{centralQuestion(path)}</span>
              </ToLink>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
