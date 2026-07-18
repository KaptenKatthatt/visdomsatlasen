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
import { Beskrivning, Row, Rumslista, Section, Sidhuvud } from './Biblioteksdelar'

const Temadel = ({ fråga }: { fråga: Question }) => {
  const themes = publishedThrough(fråga.themes, findTheme)
  if (themes.length === 0) return null
  return (
    <Section rubrik="Teman">
      {themes.map((theme) => (
        <ToLink key={theme.id} to={{ kind: 'tema', slug: theme.slug }} className={styles.rad}>
          <Row title={theme.label} />
        </ToLink>
      ))}
    </Section>
  )
}

const Kalldel = ({ fråga }: { fråga: Question }) => {
  const sources = sourcesForQuestion(fråga.id, allRooms, allSources)
  if (sources.length === 0) return null
  return (
    <Section rubrik="Källor">
      {sources.map((source) => (
        <ToLink key={source.id} to={{ kind: 'kallpost', slug: source.slug }} className={styles.rad}>
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
          className={styles.rad}
        >
          <Row title={relaterad.text} />
        </ToLink>
      ))}
    </Section>
  )
}

/** Frågesida (library.md, Questions): description, rum, themes och
 * källmaterial. En place att välja från — aldrig en automatisk lässekvens.
 * TopBar utan onBack ⇒ historiksteg bakåt — biblioteksplatsen bevaras. */
export const FragaPage = ({ slug }: { slug: string }) => {
  const question = findQuestionBySlug(slug)
  if (!question) return <NotFoundNote subject="Frågan" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Fråga" title={question.text} status={question.status} />
      <Beskrivning text={question.description} />
      <Section rubrik="Rum">
        <Rumslista
          rum={roomsForQuestion(question.id, allRooms)}
          tomtBesked="Det finns inga färdiga rum kring frågan ännu."
        />
      </Section>
      <Temadel fråga={question} />
      <Kalldel fråga={question} />
      <Narliggande fråga={question} />
    </div>
  )
}
