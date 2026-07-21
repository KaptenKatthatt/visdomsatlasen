import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useShell } from '../lib/shell'
import { useDialogKeyboard } from '../lib/useDialogKeyboard'
import { useInertBackground } from '../lib/useInertBackground'
import styles from './BottomSheet.module.css'

type Props = {
  label: string
  title?: string
  onClose: () => void
  children: ReactNode
  /** Show the "Klar" close button in the header. Default true; sheets whose own
   * items dismiss the sheet (e.g. the menu, where tapping a link closes it) pass
   * false — the scrim and Escape still close it. */
  showDone?: boolean
}

/** Shared bottom sheet: scrim, slide-up frame and a header row with a "Klar" button.
 * Portaled into the shell element (.shell) so the sheet always sits as a sibling of
 * main and nav — that way the background can be inerted and fixed positioning isn't
 * affected by ancestors with backdrop-filter. Falls back to inline when there's no shell. */
export const BottomSheet = ({ label, title, onClose, children, showDone = true }: Props) => {
  const arkRef = useRef<HTMLDivElement>(null)
  const shell = useShell()
  useDialogKeyboard(arkRef, onClose)
  useInertBackground(shell)
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
            {showDone && (
              <button type="button" className={styles.done} onClick={onClose}>
                Klar
              </button>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
  return shell ? createPortal(ark, shell) : ark
}
