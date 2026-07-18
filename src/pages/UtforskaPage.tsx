import { Link } from '@tanstack/react-router'
import { SearchIcon } from '../components/Icons'
import { RowLink } from '../components/RowLink'
import { allTraditions } from '../content/traditions'
import { findTopic } from '../content/topics'
import styles from './UtforskaPage.module.css'

export const UtforskaPage = () => (
  <div className="screenTab">
    <div className={styles.header}>
      <div className="kicker">Visdomsatlasen</div>
      <Link to="/sok" aria-label="Sök" className="iconBtn">
        <SearchIcon />
      </Link>
    </div>
    <h1 className={styles.title}>Utforska</h1>
    <p className={styles.lede}>Atlasens samlingar, ordnade efter tradition.</p>
    {allTraditions.map((tradition) => (
      <div key={tradition.name} className={styles.group}>
        <div className="kicker">{tradition.name}</div>
        <div className={styles.groupLine}>{tradition.line}</div>
        <div className={styles.groupRows}>
          {tradition.topics
            .map(findTopic)
            .filter((topic) => topic !== undefined)
            .map((topic) => (
              <RowLink
                key={topic.id}
                to={{ kind: 'topic', id: topic.id }}
                title={topic.title}
                sub={`Essä · ${topic.min} min läsning`}
                chevron
                size="lg"
              />
            ))}
        </div>
      </div>
    ))}
    <div className={styles.register}>
      <div className="kicker">Register</div>
      <div className={styles.registerRows}>
        <RowLink
          to={{ kind: 'screen', id: 'tidslinje' }}
          title="Tidslinjen"
          sub="Från Dödsboken till Självbetraktelserna"
          subItalic
          chevron
          size="lg"
        />
        <RowLink
          to={{ kind: 'screen', id: 'personer' }}
          title="Personer & traditions"
          sub="Rösterna bakom idéerna"
          subItalic
          chevron
          size="lg"
        />
      </div>
    </div>
  </div>
)
