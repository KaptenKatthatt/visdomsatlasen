import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import type { Question } from '../../content/editorial/schema'
import { sourcesForQuestion, publishedThrough, roomsForQuestion } from '../../lib/library'
import {
  allSources,
  allRooms,
  findQuestion,
  findQuestionBySlug,
  findTheme,
  sourceName,
} from '../../lib/content'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Library.module.css'
import { Description, Row, RoomList, Section, Sidhuvud } from './LibraryParts'

const ThemePart = ({ question }: { question: Question }) => {
  const themes = publishedThrough(question.themes, findTheme)
  if (themes.length === 0) return null
  return (
    <Section heading="Teman">
      {themes.map((theme) => (
        <ToLink key={theme.id} to={{ kind: 'tema', slug: theme.slug }} className={styles.row}>
          <Row title={theme.label} />
        </ToLink>
      ))}
    </Section>
  )
}

const SourcePart = ({ question }: { question: Question }) => {
  const sources = sourcesForQuestion(question.id, allRooms, allSources)
  if (sources.length === 0) return null
  return (
    <Section heading="Källor">
      {sources.map((source) => (
        <ToLink key={source.id} to={{ kind: 'kallpost', slug: source.slug }} className={styles.row}>
          <Row title={source.title} sub={sourceName(source)} />
        </ToLink>
      ))}
    </Section>
  )
}

const Narliggande = ({ question }: { question: Question }) => {
  const questions = publishedThrough(question.relatedQuestions ?? [], findQuestion)
  if (questions.length === 0) return null
  return (
    <Section heading="Närliggande frågor">
      {questions.map((relaterad) => (
        <ToLink
          key={relaterad.id}
          to={{ kind: 'fraga', slug: relaterad.slug }}
          className={styles.row}
        >
          <Row title={relaterad.text} />
        </ToLink>
      ))}
    </Section>
  )
}

/** Question page (library.md, Questions): description, rooms, themes and
 * source material. A place to choose from — never an automatic reading sequence.
 * TopBar without onBack ⇒ history step back — the library location is preserved. */
export const QuestionPage = ({ slug }: { slug: string }) => {
  const question = findQuestionBySlug(slug)
  if (!question) return <NotFoundNote subject="Frågan" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Fråga" title={question.text} status={question.status} />
      <Description text={question.description} />
      <Section heading="Rum">
        <RoomList
          rooms={roomsForQuestion(question.id, allRooms)}
          emptyMessage="Det finns inga färdiga rum kring frågan ännu."
        />
      </Section>
      <ThemePart question={question} />
      <SourcePart question={question} />
      <Narliggande question={question} />
    </div>
  )
}
