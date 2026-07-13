import { RowLink } from '../components/RowLink'
import { RumRad } from '../components/RumRad'
import { ToLink } from '../components/ToLink'
import { findTopic } from '../content/topics'
import { hittaRumViaId } from '../lib/innehall'
import { chapterKey, useAtlas } from '../lib/store'
import styles from './SamlingPage.module.css'

const excerpt = (note: string): string => {
  const trimmed = note.trim()
  return trimmed.length > 72 ? `${trimmed.slice(0, 72)}…` : trimmed
}

export const SamlingPage = () => {
  const { sparadeRum, bookmarks, chapterBookmarks, notes } = useAtlas()
  const sparade = Object.keys(sparadeRum)
    .filter((id) => sparadeRum[id])
    .map(hittaRumViaId)
    .filter((rum) => rum !== undefined)
  const bookmarked = Object.keys(bookmarks)
    .filter((id) => bookmarks[id])
    .map(findTopic)
    .filter((topic) => topic !== undefined)
  const chapterBookmarked = Object.values(chapterBookmarks).sort(
    (a, b) => b.savedAt - a.savedAt,
  )
  const noBookmarks = bookmarked.length === 0 && chapterBookmarked.length === 0
  const noted = Object.entries(notes)
    .filter(([, note]) => note.trim().length > 0)
    .map(([id, note]) => {
      const topic = findTopic(id)
      if (topic)
        return { key: id, title: topic.title, note, to: { kind: 'las', id: topic.id, mode: 'essa' } as const }
      const rum = hittaRumViaId(id)
      if (rum) return { key: id, title: rum.titel, note, to: { kind: 'rum', slug: rum.slug } as const }
      return undefined
    })
    .filter((entry) => entry !== undefined)

  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <h1 className={styles.title}>Sparat</h1>
      <p className={styles.lede}>Det du sparat och tänkt.</p>
      <div className={styles.section}>
        <div className="kicker sectionKicker">Sparade rum</div>
        {sparade.length === 0 ? (
          <p className={styles.empty}>
            Inga sparade rum ännu. I läsrummet kan du spara ett rum med Spara längst ner.
          </p>
        ) : (
          sparade.map((rum) => <RumRad key={rum.id} rum={rum} />)
        )}
      </div>
      <div className={styles.section}>
        <div className="kicker sectionKicker">Bokmärken</div>
        {noBookmarks ? (
          <p className={styles.empty}>
            Inga bokmärken ännu. När du läser kan du spara ett ämne eller ett kapitel med
            bokmärket i övre hörnet.
          </p>
        ) : (
          <>
            {bookmarked.map((topic) => (
              <RowLink
                key={topic.id}
                to={{ kind: 'topic', id: topic.id }}
                title={topic.title}
                sub={`${topic.tradition} · ${topic.min} min`}
                chevron
                size="md"
              />
            ))}
            {chapterBookmarked.map((b) => (
              <RowLink
                key={chapterKey(b.workId, b.bookSlug, b.chapter)}
                to={{ kind: 'kapitel', workId: b.workId, bookSlug: b.bookSlug, chapter: b.chapter }}
                title={b.bookName}
                sub={`Kapitel ${b.chapter}`}
                chevron
                size="md"
              />
            ))}
          </>
        )}
      </div>
      <div className={styles.sectionLater}>
        <div className="kicker sectionKicker">Anteckningar</div>
        {noted.length === 0 ? (
          <p className={styles.empty}>
            Inga anteckningar ännu. Pennan i läsläget öppnar din anteckningsbok.
          </p>
        ) : (
          noted.map(({ key, title, note, to }) => (
            <ToLink key={key} to={to} className={styles.note}>
              <span className={styles.noteTitle} style={{ display: 'block' }}>
                {title}
              </span>
              <span className={styles.noteExcerpt} style={{ display: 'block' }}>
                »{excerpt(note)}«
              </span>
            </ToLink>
          ))
        )}
      </div>
    </div>
  )
}
