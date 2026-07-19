import { ToLink } from '../components/ToLink'
import { TopBar } from '../components/TopBar'
import { timeline } from '../content/timeline'
import styles from './TimelinePage.module.css'

export const TimelinePage = () => (
  <div className="screenSub">
    <TopBar />
    <h1 className={styles.title}>Tidslinjen</h1>
    <p className={styles.lede}>Sjutton århundraden av frågor, från Nilen till Donau.</p>
    <div className={styles.events}>
      {timeline.map((event) => (
        <ToLink key={`${event.year}-${event.label}`} to={event.to} className={styles.event}>
          <span className={styles.year}>{event.year}</span>
          <span className={styles.spine}>
            <span className={styles.line} />
            <span className={styles.dot} style={{ display: 'block' }} />
          </span>
          <span className={styles.label}>{event.label}</span>
        </ToLink>
      ))}
    </div>
  </div>
)
