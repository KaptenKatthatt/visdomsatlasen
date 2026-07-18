import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import { bibliotekFragor } from '../../lib/bibliotek'
import { allaFragor } from '../../lib/innehall'
import styles from './Bibliotek.module.css'
import { frågeantal, Rad, Sidhuvud } from './Biblioteksdelar'

/** Alla publicerade frågor — en ändlig lista (library.md, Browsing): antalet
 * står överst så man ser hur mycket som finns. Ingen oändlig rullning. */
export const FragelistaPage = () => {
  const frågor = bibliotekFragor(allaFragor)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Frågor" titel="Alla frågor">
        <p className={styles.antal}>{frågeantal(frågor.length)}</p>
      </Sidhuvud>
      <div className={styles.sektion}>
        {frågor.length === 0 ? (
          <p className={styles.tomt}>Inga frågor ännu.</p>
        ) : (
          frågor.map((fråga) => (
            <ToLink key={fråga.id} to={{ kind: 'fraga', slug: fråga.slug }} className={styles.rad}>
              <Rad titel={fråga.text} />
            </ToLink>
          ))
        )}
      </div>
    </div>
  )
}
