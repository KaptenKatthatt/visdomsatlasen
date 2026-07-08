import { BookmarkButton } from '../components/BookmarkButton'
import { RowLink } from '../components/RowLink'
import { TopBar } from '../components/TopBar'
import { findPerson } from '../content/people'
import { findSource } from '../content/sources'
import { findTopic } from '../content/topics'
import type { Topic } from '../content/model'
import { useAtlas } from '../lib/store'
import { NotFoundNote } from './NotFoundNote'
import styles from './AmnePage.module.css'

const topicRowProps = (topic: Topic) => ({
  to: { kind: 'topic', id: topic.id } as const,
  title: topic.title,
  sub: `${topic.tradition} · ${topic.min} min`,
})

export const AmnePage = ({ id }: { id: string }) => {
  const topic = findTopic(id)
  const { bookmarks, toggleBookmark } = useAtlas()
  if (!topic) return <NotFoundNote subject="Ämnet" />

  const sources = topic.sources.map(findSource).filter((s) => s !== undefined)
  const people = topic.people.map(findPerson).filter((p) => p !== undefined)
  const related = topic.related.map(findTopic).filter((t) => t !== undefined)

  return (
    <div className="screenSub">
      <TopBar
        right={
          <BookmarkButton
            marked={!!bookmarks[topic.id]}
            onToggle={() => toggleBookmark(topic.id)}
            style={{ padding: '6px 0 6px 6px' }}
          />
        }
      />
      <header className={styles.head}>
        <div className="kicker">
          {topic.tradition} · {topic.min} min läsning
        </div>
        <h1 className={styles.title}>{topic.title}</h1>
      </header>
      <p className={styles.intro}>{topic.intro}</p>
      <div className={`dots ${styles.dots}`}>···</div>
      <div className={styles.firstSection}>
        <div className="kicker sectionKicker">Vägar in</div>
        <RowLink
          to={{ kind: 'las', id: topic.id, mode: 'essa' }}
          title="Läs essän"
          sub={`${topic.min} min`}
          chevron
        />
        <RowLink
          to={{ kind: 'las', id: topic.id, mode: 'kontext' }}
          title="Historisk kontext"
          sub="Bakgrund och miljö"
          chevron
        />
        {sources.map((source) => (
          <RowLink
            key={source.id}
            to={{ kind: 'source', id: source.id }}
            title={source.title}
            sub={`Originaltext · ${source.originShort}`}
            chevron
          />
        ))}
      </div>
      {people.length > 0 && (
        <div className={styles.section}>
          <div className="kicker sectionKicker">Personer</div>
          {people.map((person) => (
            <RowLink
              key={person.id}
              to={{ kind: 'person', id: person.id }}
              title={person.name}
              sub={`${person.epithet} · ${person.years}`}
              subItalic
              size="sm"
            />
          ))}
        </div>
      )}
      <div className={styles.section}>
        <div className="kicker sectionKicker">Relaterade idéer</div>
        {related.map((rel) => (
          <RowLink key={rel.id} {...topicRowProps(rel)} chevron size="sm" />
        ))}
      </div>
    </div>
  )
}
