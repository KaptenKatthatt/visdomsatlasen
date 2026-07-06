import { RowLink } from '../components/RowLink'
import { TopBar } from '../components/TopBar'
import { findPerson } from '../content/people'
import { findTopic } from '../content/topics'
import { NotFoundNote } from './NotFoundNote'
import styles from './PersonPage.module.css'

export const PersonPage = ({ id }: { id: string }) => {
  const person = findPerson(id)
  if (!person) return <NotFoundNote subject="Personen" />

  const topics = person.topics.map(findTopic).filter((t) => t !== undefined)

  return (
    <div className="screenSub">
      <TopBar />
      <header className={styles.head}>
        <div className="kicker">{person.epithet}</div>
        <h1 className={styles.name}>{person.name}</h1>
        <div className={styles.years}>{person.years}</div>
      </header>
      <div className={`dots ${styles.dots}`}>···</div>
      <p className={styles.bio}>{person.bio}</p>
      <div className={styles.links}>
        <div className="kicker sectionKicker">I atlasen</div>
        {topics.map((topic) => (
          <RowLink
            key={topic.id}
            to={{ kind: 'topic', id: topic.id }}
            title={topic.title}
            sub={`${topic.tradition} · ${topic.min} min`}
            chevron
            size="sm"
          />
        ))}
      </div>
    </div>
  )
}
