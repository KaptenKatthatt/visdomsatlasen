import { Link } from '@tanstack/react-router'
import { MoonIcon, SearchIcon } from '../components/Icons'
import { ToLink } from '../components/ToLink'
import { quoteOfTheDay } from '../content/quotes'
import { allTopics, findTopic } from '../content/topics'
import { useAtlas } from '../lib/store'
import styles from './HemPage.module.css'

const dateLabel = (): string => {
  const label = new Date().toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const LastReadCard = () => {
  const { lastRead } = useAtlas()
  const topic = lastRead ? findTopic(lastRead.id) : undefined
  if (!lastRead || !topic) return null
  const modeLabel = lastRead.mode === 'kontext' ? 'Historisk kontext' : 'Essä'
  return (
    <ToLink
      to={{ kind: 'las', id: topic.id, mode: lastRead.mode }}
      className={styles.lastRead}
    >
      <span className="kicker">Fortsätt där du var</span>
      <span className={styles.lastReadTitle} style={{ display: 'block' }}>
        {topic.title}
      </span>
      <span className={styles.lastReadSub} style={{ display: 'block' }}>
        {modeLabel} · {topic.tradition}
      </span>
    </ToLink>
  )
}

export const HemPage = () => {
  const { toggleDark } = useAtlas()
  const quote = quoteOfTheDay(new Date())
  return (
    <div className="screenTab">
      <div className={styles.header}>
        <div className="kicker">Visdomsatlasen</div>
        <div className={styles.actions}>
          <button type="button" onClick={toggleDark} aria-label="Mörkt läge" className="iconBtn">
            <MoonIcon />
          </button>
          <Link to="/sok" aria-label="Sök" className="iconBtn">
            <SearchIcon />
          </Link>
        </div>
      </div>
      <div className={styles.hero}>
        <div className={styles.date}>{dateLabel()}</div>
        <h1 className={styles.question}>Vad vill du utforska i&nbsp;dag?</h1>
      </div>
      <LastReadCard />
      <div className={styles.ideas}>
        {allTopics.map((topic) => (
          <ToLink key={topic.id} to={{ kind: 'topic', id: topic.id }} className={styles.idea}>
            <span className={styles.ideaMeta} style={{ display: 'block' }}>
              {topic.tradition} · {topic.min} min
            </span>
            <span className={styles.ideaTitle} style={{ display: 'block' }}>
              {topic.title}
            </span>
          </ToLink>
        ))}
      </div>
      <div className={styles.footer}>
        <div className="dots">···</div>
        <ToLink to={quote.to} className={styles.quote}>
          <span className={styles.quoteText} style={{ display: 'block' }}>
            »{quote.t}«
          </span>
          <span className={`kicker ${styles.quoteBy}`} style={{ display: 'block' }}>
            {quote.by}
          </span>
        </ToLink>
      </div>
    </div>
  )
}
