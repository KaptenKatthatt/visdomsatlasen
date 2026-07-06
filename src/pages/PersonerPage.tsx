import { Link } from '@tanstack/react-router'
import { ToLink } from '../components/ToLink'
import { TopBar } from '../components/TopBar'
import { allPeople } from '../content/people'
import { allTraditions } from '../content/traditions'
import styles from './PersonerPage.module.css'

export const PersonerPage = () => (
  <div className="screenSub">
    <TopBar />
    <h1 className={styles.title}>Personer &amp; traditioner</h1>
    <div className={styles.section}>
      <div className="kicker sectionKicker">Personer</div>
      {allPeople.map((person) => (
        <ToLink key={person.id} to={{ kind: 'person', id: person.id }} className={styles.entry}>
          <span className={styles.entryHead}>
            <span className={styles.name}>{person.name}</span>
            <span className={styles.years}>{person.years}</span>
          </span>
          <span className={styles.epithet} style={{ display: 'block' }}>
            {person.epithet}
          </span>
        </ToLink>
      ))}
    </div>
    <div className={styles.sectionLater}>
      <div className="kicker sectionKicker">Traditioner</div>
      {allTraditions.map((tradition) => (
        <Link key={tradition.name} to="/utforska" className={styles.entry}>
          <span className={styles.name} style={{ display: 'block' }}>
            {tradition.name}
          </span>
          <span className={styles.epithet} style={{ display: 'block' }}>
            {tradition.line}
          </span>
        </Link>
      ))}
    </div>
  </div>
)
