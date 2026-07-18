import { TopBar } from '../../components/TopBar'
import { bibliotekRum } from '../../lib/bibliotek'
import { allaRum } from '../../lib/innehall'
import styles from './Bibliotek.module.css'
import { Rumslista, rumsantal, Sidhuvud } from './Biblioteksdelar'

/** Alla publicerade rum — en ändlig lista (library.md, Browsing): antalet
 * står överst så man ser hur mycket som finns. Ingen oändlig rullning. */
export const RumlistaPage = () => {
  const rum = bibliotekRum(allaRum)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Rum" title="Alla rum">
        <p className={styles.antal}>{rumsantal(rum.length)}</p>
      </Sidhuvud>
      <div className={styles.sektion}>
        <Rumslista rum={rum} tomtBesked="Det finns inga färdiga rum ännu." />
      </div>
    </div>
  )
}
