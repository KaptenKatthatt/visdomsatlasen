import { Link } from '@tanstack/react-router'
import { ToLink } from '../../components/ToLink'
import {
  bibliotekFragor,
  bibliotekKallor,
  bibliotekRum,
  bibliotekTeman,
  bibliotekTraditioner,
  bibliotekVandringar,
  rumForVandring,
  vandringLastid,
} from '../../lib/bibliotek'
import {
  allaFragor,
  allaKallor,
  allaRum,
  allaTeman,
  allaTraditioner,
  allaVandringar,
  kallnamn,
} from '../../lib/innehall'
import { valbaraRum } from '../../lib/rumsval'
import styles from './Bibliotek.module.css'
import { Rad, rumsantal, Sektion } from './Biblioteksdelar'

// Frågorna står överst — biblioteket ordnas efter mänsklig erfarenhet,
// inte efter verk eller upphovsmän (library.md, Primary Organization).
const Fragesektion = () => {
  const frågor = bibliotekFragor(allaFragor)
  return (
    <Sektion rubrik="Frågor">
      {frågor.length === 0 ? (
        <p className={styles.tomt}>Inga frågor ännu.</p>
      ) : (
        frågor.map((fråga) => (
          <ToLink key={fråga.id} to={{ kind: 'fraga', slug: fråga.slug }} className={styles.rad}>
            <Rad titel={fråga.text} />
          </ToLink>
        ))
      )}
    </Sektion>
  )
}

const Temasektion = () => {
  const teman = bibliotekTeman(allaTeman)
  return (
    <Sektion rubrik="Teman">
      {teman.length === 0 ? (
        <p className={styles.tomt}>Inga teman ännu.</p>
      ) : (
        teman.map((tema) => (
          <ToLink key={tema.id} to={{ kind: 'tema', slug: tema.slug }} className={styles.rad}>
            <Rad titel={tema.etikett} sub={rumsantal(valbaraRum(tema.id, allaRum).length)} />
          </ToLink>
        ))
      )}
    </Sektion>
  )
}

// Vandringar är en frivillig, stilla ingång (paths.md, Discoverability) — de
// får inte stå som en tom, lovande sektion, så den döljs tills publicerade
// vandringar finns (samma disciplin som traditionerna). Utkast granskas via
// direkt länk.
const Vandringssektion = () => {
  const vandringar = bibliotekVandringar(allaVandringar)
  if (vandringar.length === 0) return null
  return (
    <Sektion rubrik="Vandringar">
      {vandringar.map((vandring) => {
        const rummen = rumForVandring(vandring, allaRum)
        const sub = `${rumsantal(rummen.length)} · ca ${vandringLastid(rummen)} min`
        return (
          <ToLink
            key={vandring.id}
            to={{ kind: 'vandring', slug: vandring.slug }}
            className={styles.rad}
          >
            <Rad titel={vandring.titel} sub={sub} />
          </ToLink>
        )
      })}
    </Sektion>
  )
}

const Rumsektion = () => (
  <Sektion rubrik="Rum">
    <Link to="/bibliotek/rum" className={styles.rad}>
      <Rad titel="Alla rum" sub={rumsantal(bibliotekRum(allaRum).length)} />
    </Link>
  </Sektion>
)

const Kallsektion = () => (
  <Sektion rubrik="Källor">
    {bibliotekKallor(allaKallor).map((källa) => (
      <ToLink key={källa.id} to={{ kind: 'kallpost', slug: källa.slug }} className={styles.rad}>
        <Rad titel={källa.titel} sub={kallnamn(källa)} />
      </ToLink>
    ))}
    <Link to="/bibliotek/verk" className={styles.rad}>
      <Rad titel="Hela texter" sub="Källtexterna i sin helhet, att läsa och söka i" />
    </Link>
  </Sektion>
)

// Traditioner är en sekundär ingång utan egna sidor än (roadmap fas 6:
// stödposter). Sektionen visas först när publicerade traditioner finns.
const Traditionssektion = () => {
  const traditioner = bibliotekTraditioner(allaTraditioner)
  if (traditioner.length === 0) return null
  return (
    <Sektion rubrik="Traditioner">
      {traditioner.map((tradition) => (
        <div key={tradition.id} className={styles.stillaRad}>
          <span className={styles.radTitel}>{tradition.namn}</span>
          {tradition.beskrivning && (
            <span className={styles.radSub}>{tradition.beskrivning}</span>
          )}
        </div>
      ))}
    </Sektion>
  )
}

/**
 * Bibliotekets landningssida (library.md) — den medvetna ingången till
 * utforskning. Sekundär till läsrummet; lugn, ändlig, utan engagemangsmått.
 * Frågor och teman står före rum, källor och traditioner.
 */
export const BibliotekHemPage = () => (
  <div className="screenTab">
    <div className="kicker">Visdomsatlasen</div>
    <h1 className={styles.titel}>Biblioteket</h1>
    <p className={styles.lede}>
      För den som vill leta vidare på egen hand — bland frågor, teman, rum och källor.
    </p>
    <Fragesektion />
    <Temasektion />
    <Vandringssektion />
    <Rumsektion />
    <Kallsektion />
    <Traditionssektion />
    <Sektion rubrik="Sparat">
      <Link to="/samling" className={styles.rad}>
        <Rad titel="Sparat" sub="Det du sparat och antecknat" />
      </Link>
    </Sektion>
  </div>
)
