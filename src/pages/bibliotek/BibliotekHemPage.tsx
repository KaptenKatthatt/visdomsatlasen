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
import { useSidtitel } from '../../lib/useSidtitel'
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
import { frågeantal, Rad, rumsantal, Sektion } from './Biblioteksdelar'

// Frågorna samlas bakom en enda ingång (som rummen) — hela listan bor på
// undersidan, så landningssidan förblir kort och lugn (library.md).
const Fragesektion = () => (
  <Sektion rubrik="Frågor">
    <Link to="/bibliotek/fragor" className={styles.rad}>
      <Rad title="Alla frågor" sub={frågeantal(bibliotekFragor(allaFragor).length)} />
    </Link>
  </Sektion>
)

const Temasektion = () => {
  const themes = bibliotekTeman(allaTeman)
  return (
    <Sektion rubrik="Teman">
      {themes.length === 0 ? (
        <p className={styles.tomt}>Inga themes ännu.</p>
      ) : (
        themes.map((tema) => (
          <ToLink key={tema.id} to={{ kind: 'tema', slug: tema.slug }} className={styles.rad}>
            <Rad title={tema.label} sub={rumsantal(valbaraRum(tema.id, allaRum).length)} />
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
            <Rad title={vandring.title} sub={sub} />
          </ToLink>
        )
      })}
    </Sektion>
  )
}

const Rumsektion = () => (
  <Sektion rubrik="Rum">
    <Link to="/bibliotek/rum" className={styles.rad}>
      <Rad title="Alla rum" sub={rumsantal(bibliotekRum(allaRum).length)} />
    </Link>
  </Sektion>
)

const Kallsektion = () => (
  <Sektion rubrik="Källor">
    {bibliotekKallor(allaKallor).map((source) => (
      <ToLink key={source.id} to={{ kind: 'kallpost', slug: source.slug }} className={styles.rad}>
        <Rad title={source.title} sub={kallnamn(source)} />
      </ToLink>
    ))}
    <Link to="/bibliotek/verk" className={styles.rad}>
      <Rad title="Hela texter" sub="Källtexterna i sin helhet, att läsa och söka i" />
    </Link>
  </Sektion>
)

// Traditioner är en sekundär ingång utan egna sidor än (roadmap fas 6:
// stödposter). Sektionen visas först när publicerade traditions finns.
const Traditionssektion = () => {
  const traditions = bibliotekTraditioner(allaTraditioner)
  if (traditions.length === 0) return null
  return (
    <Sektion rubrik="Traditioner">
      {traditions.map((tradition) => (
        <div key={tradition.id} className={styles.stillaRad}>
          <span className={styles.radTitel}>{tradition.name}</span>
          {tradition.description && (
            <span className={styles.radSub}>{tradition.description}</span>
          )}
        </div>
      ))}
    </Sektion>
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
        För den som vill leta vidare på egen hand — bland traditions, sources, themes och frågor.
      </p>
      <Link to="/bibliotek/sok" className={styles.sokingang}>
        Sök efter en fråga, tanke eller source
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
