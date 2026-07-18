import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import { libraryQuestions } from '../../lib/library'
import { allQuestions } from '../../lib/content'
import styles from './Bibliotek.module.css'
import { questionCount, Row, Sidhuvud } from './Biblioteksdelar'

/** Alla publicerade frågor — en ändlig lista (library.md, Browsing): antalet
 * står överst så man ser hur mycket som finns. Ingen oändlig rullning. */
export const FragelistaPage = () => {
  const questions = libraryQuestions(allQuestions)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Frågor" title="Alla frågor">
        <p className={styles.antal}>{questionCount(questions.length)}</p>
      </Sidhuvud>
      <div className={styles.sektion}>
        {questions.length === 0 ? (
          <p className={styles.tomt}>Inga frågor ännu.</p>
        ) : (
          questions.map((question) => (
            <ToLink key={question.id} to={{ kind: 'fraga', slug: question.slug }} className={styles.rad}>
              <Row title={question.text} />
            </ToLink>
          ))
        )}
      </div>
    </div>
  )
}
