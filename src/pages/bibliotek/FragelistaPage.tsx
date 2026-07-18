import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import { libraryQuestions } from '../../lib/library'
import { allQuestions } from '../../lib/content'
import styles from './Bibliotek.module.css'
import { questionCount, Row, Sidhuvud } from './Biblioteksdelar'

/** All published questions — a finite list (library.md, Browsing): the count
 * stands at the top so you can see how much there is. No infinite scroll. */
export const FragelistaPage = () => {
  const questions = libraryQuestions(allQuestions)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Frågor" title="Alla frågor">
        <p className={styles.antal}>{questionCount(questions.length)}</p>
      </Sidhuvud>
      <div className={styles.section}>
        {questions.length === 0 ? (
          <p className={styles.empty}>Inga frågor ännu.</p>
        ) : (
          questions.map((question) => (
            <ToLink key={question.id} to={{ kind: 'fraga', slug: question.slug }} className={styles.row}>
              <Row title={question.text} />
            </ToLink>
          ))
        )}
      </div>
    </div>
  )
}
