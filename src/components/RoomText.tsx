import type { Room } from '../content/editorial/schema'
import { paragraphs } from '../lib/content'
import styles from './RoomText.module.css'

/** Rummets prosa — rubrik, öppning, veck, kärna, veck, tanken att bära och
 * reflektionsfrågorna — delad mellan det fristående läsrummet och vandringens
 * flöde så de två ytorna aldrig glider isär. Rubriknivån följer ytan: h1 när
 * rummet äger sidan, h2 i flödet där vandringen gör det. `anchor` sätter id på
 * rummets första sektion så flödet kan öppnas vid en viss anhalt. */
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
