import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useShell } from '../lib/shell'
import { useDialogTangentbord } from '../lib/useDialogTangentbord'
import { useInertBakgrund } from '../lib/useInertBakgrund'
import styles from './BottomSheet.module.css'

type Props = {
  label: string
  title?: string
  onClose: () => void
  children: ReactNode
}

/** Delat bottenark: scrim, uppglidande ram och rubrikrad med "Klar"-knapp.
 * Portalas till skalelementet (.shell) så arket alltid ligger som syskon till
 * main och nav — då kan bakgrunden inertas och fixed-positionering påverkas
 * inte av förfäder med backdrop-filter. Faller tillbaka till inline utan skal. */
export const BottomSheet = ({ label, title, onClose, children }: Props) => {
  const arkRef = useRef<HTMLDivElement>(null)
  const shell = useShell()
  useDialogTangentbord(arkRef, onClose)
  useInertBakgrund(shell)
  const ark = (
    <div className={styles.overlay} data-overlay="true">
      <button
        type="button"
        className={styles.scrim}
        onClick={onClose}
        aria-label={`Stäng ${label.toLowerCase()}`}
        tabIndex={-1}
      />
      <div className={styles.holder}>
        <div
          ref={arkRef}
          className={styles.sheet}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
        >
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
  return shell ? createPortal(ark, shell) : ark
}
