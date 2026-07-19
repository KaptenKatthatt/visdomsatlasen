import { ReadingSettingsButton } from '../components/ReadingSettingsButton'
import { RowLink } from '../components/RowLink'
import { TopBar } from '../components/TopBar'
import { findSource } from '../content/sources'
import { topicsUsingSource } from '../content/topics'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { NotFoundNote } from './NotFoundNote'
import styles from './SourcePage.module.css'

export const SourcePage = ({ id }: { id: string }) => {
  const source = findSource(id)
  useDocumentTitle(source?.title)
  if (!source) return <NotFoundNote subject="Originaltexten" />

  return (
    <div className="screenReader">
      <TopBar right={<ReadingSettingsButton />} />
      <header className={styles.head}>
        <div className="kicker">Originaltext</div>
        <h1 className={styles.title}>{source.title}</h1>
        <div className={styles.author}>{source.author}</div>
      </header>
      <div className={styles.meta}>
        <div className={styles.metaLabel}>Tillkomst</div>
        <div>{source.origin}</div>
        <div className={styles.metaLabel}>Språk</div>
        <div>{source.lang}</div>
        <div className={styles.metaLabel}>Översättning</div>
        <div>{source.trans}</div>
      </div>
      <div className={styles.verses}>
        {source.text.map((verse, index) => (
          <p key={index} className={styles.verse}>
            {verse}
          </p>
        ))}
      </div>
      <div className={`dots ${styles.dots}`}>···</div>
      <div className={styles.about}>
        <div className="kicker">Om texten</div>
        <p className={styles.aboutNote}>{source.note}</p>
      </div>
      <div className={styles.usedIn}>
        <h2 className="kicker sectionKicker">Läses i</h2>
        {topicsUsingSource(source.id).map((topic) => (
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
