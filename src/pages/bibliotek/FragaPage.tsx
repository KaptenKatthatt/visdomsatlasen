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
import styles from './Bibliotek.module.css'
import { Beskrivning, Row, RoomList, Section, Sidhuvud } from './Biblioteksdelar'

const Temadel = ({ fråga }: { fråga: Question }) => {
  const themes = publishedThrough(fråga.themes, findTheme)
  if (themes.length === 0) return null
  return (
    <Section rubrik="Teman">
      {themes.map((theme) => (
        <ToLink key={theme.id} to={{ kind: 'tema', slug: theme.slug }} className={styles.row}>
          <Row title={theme.label} />
        </ToLink>
      ))}
    </Section>
  )
}

const SourcePart = ({ fråga }: { fråga: Question }) => {
  const sources = sourcesForQuestion(fråga.id, allRooms, allSources)
  if (sources.length === 0) return null
  return (
    <Section rubrik="Källor">
      {sources.map((source) => (
        <ToLink key={source.id} to={{ kind: 'kallpost', slug: source.slug }} className={styles.row}>
          <Row title={source.title} sub={sourceName(source)} />
        </ToLink>
      ))}
    </Section>
  )
}

const Narliggande = ({ fråga }: { fråga: Question }) => {
  const questions = publishedThrough(fråga.relatedQuestions ?? [], findQuestion)
  if (questions.length === 0) return null
  return (
    <Section rubrik="Närliggande frågor">
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
export const FragaPage = ({ slug }: { slug: string }) => {
  const question = findQuestionBySlug(slug)
  if (!question) return <NotFoundNote subject="Frågan" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Fråga" title={question.text} status={question.status} />
      <Beskrivning text={question.description} />
      <Section rubrik="Rum">
        <RoomList
          rum={roomsForQuestion(question.id, allRooms)}
          tomtBesked="Det finns inga färdiga rum kring frågan ännu."
        />
      </Section>
      <Temadel fråga={question} />
      <SourcePart fråga={question} />
      <Narliggande fråga={question} />
    </div>
  )
}
