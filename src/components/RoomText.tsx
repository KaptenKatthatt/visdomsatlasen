import type { Room } from '../content/editorial/schema'
import { paragraphs } from '../lib/content'
import styles from './RoomText.module.css'

/** The room's prose — heading, opening, fold, core, fold, the thought to carry
 * and the reflection questions — shared by the freestanding reading room and the
 * path's flow so the two surfaces never drift apart. The heading level follows
 * the surface: h1 when the room owns the page, h2 in the flow where the path
 * does. `anchor` puts an id on the room's first section, so the flow can be
 * opened at a given stop. */
export const RoomText = ({
  room,
  heading,
  kicker,
  anchor,
}: {
  room: Room
  heading: 'h1' | 'h2'
  kicker?: string
  anchor?: string
}) => {
  const Heading = heading
  return (
    <>
      <section id={anchor} className={styles.section}>
        <header className={styles.head}>
          {kicker !== undefined && <div className="kicker">{kicker}</div>}
          <Heading className={styles.title}>{room.title}</Heading>
        </header>
        {paragraphs(room.opening).map((paragraph, i) => (
          <p key={i} className={styles.stycke}>
            {paragraph}
          </p>
        ))}
        <div className={`dots ${styles.pause}`}>···</div>
      </section>
      <section className={styles.section}>
        {paragraphs(room.core).map((paragraph, i) => (
          <p key={i} className={styles.stycke}>
            {paragraph}
          </p>
        ))}
        <div className={`dots ${styles.pause}`}>···</div>
      </section>
      <p className={styles.thought}>{room.thoughtToCarry}</p>
      <div className={styles.questions}>
        {room.reflectionQuestions.map((question) => (
          <p key={question} className={styles.question}>
            {question}
          </p>
        ))}
      </div>
    </>
  )
}
