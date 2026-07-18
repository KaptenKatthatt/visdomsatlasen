import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import { questionsForTheme } from '../../lib/library'
import { allQuestions, allRooms, findThemeBySlug } from '../../lib/content'
import { valbaraRoom } from '../../lib/roomSelection'
import { NotFoundNote } from '../NotFoundNote'
import styles from './Bibliotek.module.css'
import { Beskrivning, Row, Rumslista, Section, Sidhuvud } from './Biblioteksdelar'

const Fragedel = ({ temaId }: { temaId: string }) => {
  const frågor = questionsForTheme(temaId, allQuestions)
  if (frågor.length === 0) return null
  return (
    <Section rubrik="Frågor">
      {frågor.map((fråga) => (
        <ToLink key={fråga.id} to={{ kind: 'fraga', slug: fråga.slug }} className={styles.rad}>
          <Row title={fråga.text} />
        </ToLink>
      ))}
    </Section>
  )
}

/** Temasida (library.md, Themes): description, temats frågor och publicerade
 * rum. TopBar utan onBack ⇒ historiksteg bakåt — biblioteksplatsen bevaras. */
export const TemaPage = ({ slug }: { slug: string }) => {
  const tema = findThemeBySlug(slug)
  if (!tema) return <NotFoundNote subject="Temat" />
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Tema" title={tema.label} status={tema.status} />
      <Beskrivning text={tema.description} />
      <Fragedel temaId={tema.id} />
      <Section rubrik="Rum">
        <Rumslista
          rum={valbaraRoom(tema.id, allRooms)}
          tomtBesked="Det finns inga färdiga rum här ännu."
        />
      </Section>
    </div>
  )
}
