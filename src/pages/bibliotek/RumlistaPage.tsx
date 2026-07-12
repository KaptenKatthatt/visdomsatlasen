import { useNavigate } from '@tanstack/react-router'
import { RumRad } from '../../components/RumRad'
import { TopBar } from '../../components/TopBar'
import { bibliotekRum } from '../../lib/bibliotek'
import { allaRum } from '../../lib/innehall'
import styles from './Bibliotek.module.css'

/** Alla publicerade rum — en ändlig lista (library.md, Browsing): antalet
 * står överst så man ser hur mycket som finns. Ingen oändlig rullning. */
export const RumlistaPage = () => {
  const rum = bibliotekRum(allaRum)
  const navigate = useNavigate()
  return (
    <div className="screenSub">
      <TopBar onBack={() => navigate({ to: '/bibliotek' })} />
      <header className={styles.huvud}>
        <div className="kicker">Rum</div>
        <h1 className={styles.huvudTitel}>Alla rum</h1>
        <p className={styles.antal}>{rum.length === 1 ? 'Ett rum' : `${rum.length} rum`}</p>
      </header>
      <div className={styles.sektion}>
        {rum.length === 0 ? (
          <p className={styles.tomt}>Det finns inga färdiga rum ännu.</p>
        ) : (
          rum.map((ettRum) => <RumRad key={ettRum.id} rum={ettRum} />)
        )}
      </div>
    </div>
  )
}
