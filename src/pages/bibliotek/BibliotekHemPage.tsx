import { Link } from '@tanstack/react-router'
import { ToLink } from '../../components/ToLink'
import {
  libraryQuestions,
  librarySources,
  libraryRooms,
  libraryThemes,
  libraryTraditions,
  libraryPaths,
  roomsForPath,
  pathReadingTime,
} from '../../lib/library'
import { useSidtitel } from '../../lib/useSidtitel'
import {
  allQuestions,
  allSources,
  allRooms,
  allThemes,
  allTraditions,
  allPaths,
  sourceName,
} from '../../lib/content'
import { valbaraRoom } from '../../lib/roomSelection'
import styles from './Bibliotek.module.css'
import { questionCount, Row, roomCount, Section } from './Biblioteksdelar'

// Frågorna samlas bakom en enda ingång (som rummen) — hela listan bor på
// undersidan, så landningssidan förblir kort och lugn (library.md).
const Fragesektion = () => (
  <Section rubrik="Frågor">
    <Link to="/bibliotek/fragor" className={styles.rad}>
      <Row title="Alla frågor" sub={questionCount(libraryQuestions(allQuestions).length)} />
    </Link>
  </Section>
)

const Temasektion = () => {
  const themes = libraryThemes(allThemes)
  return (
    <Section rubrik="Teman">
      {themes.length === 0 ? (
        <p className={styles.tomt}>Inga teman ännu.</p>
      ) : (
        themes.map((tema) => (
          <ToLink key={tema.id} to={{ kind: 'tema', slug: tema.slug }} className={styles.rad}>
            <Row title={tema.label} sub={roomCount(valbaraRoom(tema.id, allRooms).length)} />
          </ToLink>
        ))
      )}
    </Section>
  )
}

// Vandringar är en frivillig, stilla ingång (paths.md, Discoverability) — de
// får inte stå som en tom, lovande sektion, så den döljs tills publicerade
// vandringar finns (samma disciplin som traditionerna). Utkast granskas via
// direkt länk.
const Vandringssektion = () => {
  const vandringar = libraryPaths(allPaths)
  if (vandringar.length === 0) return null
  return (
    <Section rubrik="Vandringar">
      {vandringar.map((vandring) => {
        const rummen = roomsForPath(vandring, allRooms)
        const sub = `${roomCount(rummen.length)} · ca ${pathReadingTime(rummen)} min`
        return (
          <ToLink
            key={vandring.id}
            to={{ kind: 'vandring', slug: vandring.slug }}
            className={styles.rad}
          >
            <Row title={vandring.title} sub={sub} />
          </ToLink>
        )
      })}
    </Section>
  )
}

const Rumsektion = () => (
  <Section rubrik="Rum">
    <Link to="/bibliotek/rum" className={styles.rad}>
      <Row title="Alla rum" sub={roomCount(libraryRooms(allRooms).length)} />
    </Link>
  </Section>
)

const Kallsektion = () => (
  <Section rubrik="Källor">
    {librarySources(allSources).map((source) => (
      <ToLink key={source.id} to={{ kind: 'kallpost', slug: source.slug }} className={styles.rad}>
        <Row title={source.title} sub={sourceName(source)} />
      </ToLink>
    ))}
    <Link to="/bibliotek/verk" className={styles.rad}>
      <Row title="Hela texter" sub="Källtexterna i sin helhet, att läsa och söka i" />
    </Link>
  </Section>
)

// Traditioner är en sekundär ingång utan egna sidor än (roadmap fas 6:
// stödposter). Sektionen visas först när publicerade traditions finns.
const Traditionssektion = () => {
  const traditions = libraryTraditions(allTraditions)
  if (traditions.length === 0) return null
  return (
    <Section rubrik="Traditioner">
      {traditions.map((tradition) => (
        <div key={tradition.id} className={styles.stillaRad}>
          <span className={styles.radTitel}>{tradition.name}</span>
          {tradition.description && (
            <span className={styles.radSub}>{tradition.description}</span>
          )}
        </div>
      ))}
    </Section>
  )
}

/**
 * Bibliotekets landningssida (library.md) — den medvetna ingången till
 * utforskning. Sekundär till läsrummet; lugn, ändlig, utan engagemangsmått.
 * Traditioner och sources står överst som bibliotekets lugna ram (redaktörens
 * beslut 2026-07-18), frågorna samlade längst ner. Sparat nås via navfliken.
 */
export const BibliotekHemPage = () => {
  useSidtitel('Biblioteket')
  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <h1 className={styles.title}>Biblioteket</h1>
      <p className={styles.lede}>
        För den som vill leta vidare på egen hand — bland traditioner, källor, teman och frågor.
      </p>
      <Link to="/bibliotek/sok" className={styles.sokingang}>
        Sök efter en fråga, tanke eller källa
      </Link>
      <Traditionssektion />
      <Kallsektion />
      <Temasektion />
      <Vandringssektion />
      <Rumsektion />
      <Fragesektion />
    </div>
  )
}
