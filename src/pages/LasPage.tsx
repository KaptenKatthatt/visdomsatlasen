import { useEffect, useState } from 'react'
import { LinkedParagraph } from '../components/LinkedParagraph'
import { NotesSheet } from '../components/NotesSheet'
import { RowLink } from '../components/RowLink'
import { TopBar } from '../components/TopBar'
import type { ReadMode } from '../content/model'
import { findSource } from '../content/sources'
import { findTopic } from '../content/topics'
import { useAtlas } from '../lib/store'
import { useSidtitel } from '../lib/useSidtitel'
import { LasActions } from './LasActions'
import { NotFoundNote } from './NotFoundNote'
import styles from './LasPage.module.css'

export const LasPage = ({ id, mode }: { id: string; mode: ReadMode }) => {
  const topic = findTopic(id)
  const { anteckningar, sattAnteckning, taBortAnteckning, recordRead } = useAtlas()
  const [notesOpen, setNotesOpen] = useState(false)
  useSidtitel(topic?.title)

  useEffect(() => {
    if (topic) recordRead(topic.id, mode)
  }, [topic, mode, recordRead])

  if (!topic) return <NotFoundNote subject="Texten" />

  const paragraphs = mode === 'kontext' ? topic.context : topic.essay
  const sources = topic.sources.map(findSource).filter((s) => s !== undefined)
  const related = topic.related.map(findTopic).filter((t) => t !== undefined)
  const note = anteckningar[topic.id]?.text ?? ''
  const noteHint = note.trim().length > 0 ? note.trim() : 'Skriv en tanke'

  return (
    <div className="screenReader">
      <TopBar
        right={<LasActions topicId={topic.id} onOpenNotes={() => setNotesOpen(true)} />}
      />
      <header className={styles.head}>
        <div className="kicker">
          {topic.tradition} · {mode === 'kontext' ? 'Historisk kontext' : 'Essä'}
        </div>
        <h1 className={styles.title}>{topic.title}</h1>
        <div className={styles.min}>{topic.min} minuters läsning</div>
      </header>
      <div className={styles.body}>
        {paragraphs.map((paragraph, index) => (
          <LinkedParagraph key={index} paragraph={paragraph} />
        ))}
      </div>
      <div className={`dots ${styles.dots}`}>···</div>
      <div className={styles.section}>
        <div className="kicker sectionKicker">Ur källorna</div>
        {sources.map((source) => (
          <RowLink
            key={source.id}
            to={{ kind: 'source', id: source.id }}
            title={source.title}
            sub={`${source.originShort} · ${source.lang}`}
            chevron
            size="sm"
          />
        ))}
      </div>
      <div className={styles.sectionWide}>
        <div className="kicker sectionKicker">Läs vidare</div>
        {related.map((rel) => (
          <RowLink
            key={rel.id}
            to={{ kind: 'topic', id: rel.id }}
            title={rel.title}
            sub={`${rel.tradition} · ${rel.min} min`}
            chevron
            size="sm"
          />
        ))}
      </div>
      <button type="button" className={styles.notesRow} onClick={() => setNotesOpen(true)}>
        <span className={styles.notesLabel}>Egna anteckningar</span>
        <span className={styles.notesHint}>{noteHint}</span>
      </button>
      {notesOpen && (
        <NotesSheet
          title={topic.title}
          value={note}
          onChange={(value) => sattAnteckning('amne', topic.id, value)}
          onDelete={() => taBortAnteckning(topic.id)}
          onClose={() => setNotesOpen(false)}
        />
      )}
    </div>
  )
}
