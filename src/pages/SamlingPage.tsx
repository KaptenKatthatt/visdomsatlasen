import { RowLink } from '../components/RowLink'
import { ToLink } from '../components/ToLink'
import { findTopic } from '../content/topics'
import { useAtlas } from '../lib/store'
import styles from './SamlingPage.module.css'

const excerpt = (note: string): string => {
  const trimmed = note.trim()
  return trimmed.length > 72 ? `${trimmed.slice(0, 72)}…` : trimmed
}

export const SamlingPage = () => {
  const { bookmarks, notes } = useAtlas()
  const bookmarked = Object.keys(bookmarks)
    .filter((id) => bookmarks[id])
    .map(findTopic)
    .filter((topic) => topic !== undefined)
  const noted = Object.entries(notes)
    .filter(([id, note]) => note.trim().length > 0 && findTopic(id) !== undefined)
    .map(([id, note]) => ({ topic: findTopic(id), note }))
    .filter((entry) => entry.topic !== undefined)

  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <h1 className={styles.title}>Samling</h1>
      <p className={styles.lede}>Det du sparat och tänkt.</p>
      <div className={styles.section}>
        <div className="kicker sectionKicker">Bokmärken</div>
        {bookmarked.length === 0 ? (
          <p className={styles.empty}>
            Inga bokmärken ännu. När du läser kan du spara ett ämne med bokmärket i övre hörnet.
          </p>
        ) : (
          bookmarked.map((topic) => (
            <RowLink
              key={topic.id}
              to={{ kind: 'topic', id: topic.id }}
              title={topic.title}
              sub={`${topic.tradition} · ${topic.min} min`}
              chevron
              size="md"
            />
          ))
        )}
      </div>
      <div className={styles.sectionLater}>
        <div className="kicker sectionKicker">Anteckningar</div>
        {noted.length === 0 ? (
          <p className={styles.empty}>
            Inga anteckningar ännu. Pennan i läsläget öppnar din anteckningsbok.
          </p>
        ) : (
          noted.map(({ topic, note }) =>
            topic ? (
              <ToLink
                key={topic.id}
                to={{ kind: 'las', id: topic.id, mode: 'essa' }}
                className={styles.note}
              >
                <span className={styles.noteTitle} style={{ display: 'block' }}>
                  {topic.title}
                </span>
                <span className={styles.noteExcerpt} style={{ display: 'block' }}>
                  »{excerpt(note)}«
                </span>
              </ToLink>
            ) : null,
          )
        )}
      </div>
    </div>
  )
}
