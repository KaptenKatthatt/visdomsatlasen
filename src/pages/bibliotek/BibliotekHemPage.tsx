import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ToLink } from '../../components/ToLink'
import { bibliotekRum, bibliotekTeman } from '../../lib/bibliotek'
import { allaRum, allaTeman } from '../../lib/innehall'
import { valbaraRum } from '../../lib/rumsval'
import styles from './Bibliotek.module.css'

const rumsantal = (antal: number): string => (antal === 1 ? 'Ett rum' : `${antal} rum`)

// Radens innehåll — själva länken varierar (statisk route eller ToLink).
const Rad = ({ titel, sub }: { titel: string; sub?: string }) => (
  <>
    <span>
      <span className={styles.radTitel}>{titel}</span>
      {sub !== undefined && <span className={styles.radSub}>{sub}</span>}
    </span>
    <span className={styles.chev}>›</span>
  </>
)

const Sektion = ({ rubrik, children }: { rubrik: string; children: ReactNode }) => (
  <div className={styles.sektion}>
    <div className="kicker sectionKicker">{rubrik}</div>
    {children}
  </div>
)

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

const Rumsektion = () => (
  <Sektion rubrik="Rum">
    <Link to="/bibliotek/rum" className={styles.rad}>
      <Rad titel="Alla rum" sub={rumsantal(bibliotekRum(allaRum).length)} />
    </Link>
  </Sektion>
)

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
    <Temasektion />
    <Rumsektion />
    <Sektion rubrik="Källor">
      <Link to="/bibliotek/verk" className={styles.rad}>
        <Rad titel="Hela texter" sub="Källtexterna i sin helhet, att läsa och söka i" />
      </Link>
    </Sektion>
    <Sektion rubrik="Sparat">
      <Link to="/samling" className={styles.rad}>
        <Rad titel="Sparat" sub="Det du sparat och antecknat" />
      </Link>
    </Sektion>
  </div>
)
