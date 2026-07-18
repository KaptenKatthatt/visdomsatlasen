import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import { questionsForTheme } from '../../lib/library'
import { allQuestions, allRooms, findThemeBySlug } from '../../lib/content'
import { valbaraRoom } from '../../lib/roomSelection'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Row, RoomList, Section, Sidhuvud } from './Biblioteksdelar'

const QuestionPart = ({ temaId }: { temaId: string }) => {
  const questions = questionsForTheme(temaId, allQuestions)
  if (questions.length === 0) return null
  return (
    <Section rubrik="Frågor">
      {questions.map((question) => (
        <ToLink key={question.id} to={{ kind: 'fraga', slug: question.slug }} className={styles.row}>
          <Row title={question.text} />
        </ToLink>
      ))}
    </Section>
  )
}

/** Theme page (library.md, Themes): description, the theme's questions and published
 * rooms. TopBar without onBack ⇒ history step back — the library location is preserved. */
export const TemaPage = ({ slug }: { slug: string }) => {
  const theme = findThemeBySlug(slug)
  if (!theme) return <NotFoundNote subject="Temat" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Tema" title={theme.label} status={theme.status} />
      <Beskrivning text={theme.description} />
      <QuestionPart temaId={theme.id} />
      <Section rubrik="Rum">
        <RoomList
          rum={valbaraRoom(theme.id, allRooms)}
          tomtBesked="Det finns inga färdiga rum här ännu."
        />
      </Section>
    </div>
  )
}
