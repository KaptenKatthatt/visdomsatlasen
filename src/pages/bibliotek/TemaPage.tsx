import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import { questionsForTheme } from '../../lib/library'
import { allQuestions, allRooms, findThemeBySlug } from '../../lib/content'
import { valbaraRoom } from '../../lib/roomSelection'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Row, Rumslista, Section, Sidhuvud } from './Biblioteksdelar'

const Fragedel = ({ temaId }: { temaId: string }) => {
  const questions = questionsForTheme(temaId, allQuestions)
  if (questions.length === 0) return null
  return (
    <Section rubrik="Frågor">
      {questions.map((question) => (
        <ToLink key={question.id} to={{ kind: 'fraga', slug: question.slug }} className={styles.rad}>
          <Row title={question.text} />
        </ToLink>
      ))}
    </Section>
  )
}

/** Temasida (library.md, Themes): description, temats frågor och publicerade
 * rum. TopBar utan onBack ⇒ historiksteg bakåt — biblioteksplatsen bevaras. */
export const TemaPage = ({ slug }: { slug: string }) => {
  const theme = findThemeBySlug(slug)
  if (!theme) return <NotFoundNote subject="Temat" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Tema" title={theme.label} status={theme.status} />
      <Beskrivning text={theme.description} />
      <Fragedel temaId={theme.id} />
      <Section rubrik="Rum">
        <Rumslista
          rum={valbaraRoom(theme.id, allRooms)}
          tomtBesked="Det finns inga färdiga rum här ännu."
        />
      </Section>
    </div>
  )
}
