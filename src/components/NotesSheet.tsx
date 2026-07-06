import styles from './NotesSheet.module.css'

type Props = {
  title: string
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

/** Bottom-sheet notebook attached to a topic in reading mode. */
export const NotesSheet = ({ title, value, onChange, onClose }: Props) => (
  <div className={styles.overlay}>
    <button
      type="button"
      className={styles.scrim}
      onClick={onClose}
      aria-label="Stäng anteckningar"
    />
    <div className={styles.holder}>
      <div className={styles.sheet} role="dialog" aria-label="Anteckningar">
        <div className={styles.head}>
          <div>
            <div className="kicker">Anteckningar</div>
            <div className={styles.title}>{title}</div>
          </div>
          <button type="button" className={styles.done} onClick={onClose}>
            Klar
          </button>
        </div>
        <textarea
          className={styles.textarea}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={7}
          placeholder="Tankar, frågor, invändningar…"
          autoFocus
        />
      </div>
    </div>
  </div>
)
