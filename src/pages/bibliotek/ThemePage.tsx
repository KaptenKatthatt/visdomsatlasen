import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import { questionsForTheme } from '../../lib/library'
import { allQuestions, allRooms, findThemeBySlug } from '../../lib/content'
import { valbaraRoom } from '../../lib/roomSelection'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Library.module.css'
import { Description, Row, RoomList, Section, Sidhuvud } from './LibraryParts'

const QuestionPart = ({ themeId }: { themeId: string }) => {
  const questions = questionsForTheme(themeId, allQuestions)
  if (questions.length === 0) return null
  return (
    <Section heading="Frågor">
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
export const ThemePage = ({ slug }: { slug: string }) => {
  const theme = findThemeBySlug(slug)
  if (!theme) return <NotFoundNote subject="Temat" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Tema" title={theme.label} status={theme.status} />
      <Description text={theme.description} />
      <QuestionPart themeId={theme.id} />
      <Section heading="Rum">
        <RoomList
          rooms={valbaraRoom(theme.id, allRooms)}
          emptyMessage="Det finns inga färdiga rum här ännu."
        />
      </Section>
    </div>
  )
}
