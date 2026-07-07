import type { ReactNode } from 'react'
import styles from './BottomSheet.module.css'

type Props = {
  label: string
  title?: string
  onClose: () => void
  children: ReactNode
}

/** Delat bottenark: scrim, uppglidande ram och rubrikrad med "Klar"-knapp. */
export const BottomSheet = ({ label, title, onClose, children }: Props) => (
  <div className={styles.overlay}>
    <button
      type="button"
      className={styles.scrim}
      onClick={onClose}
      aria-label={`Stäng ${label.toLowerCase()}`}
    />
    <div className={styles.holder}>
      <div className={styles.sheet} role="dialog" aria-label={label}>
        <div className={styles.head}>
          <div>
            <div className="kicker">{label}</div>
            {title && <div className={styles.title}>{title}</div>}
          </div>
          <button type="button" className={styles.done} onClick={onClose}>
            Klar
          </button>
        </div>
        {children}
      </div>
    </div>
  </div>
)
