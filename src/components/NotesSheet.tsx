import { useState } from 'react'
import { useDebounced } from '../lib/useDebounced'
import { BottomSheet } from './BottomSheet'
import styles from './NotesSheet.module.css'

type Props = {
  title: string
  value: string
  onChange: (value: string) => void
  onClose: () => void
  onDelete?: () => void
}

/** The sheet's footer: quiet autosave status on the left, deletion on the right.
 * Deletion requires a simple in-place confirmation — the content is personal
 * and may not be recoverable (spec Deleting Notes). No window.confirm. */
const Foot = ({
  sparadVisas,
  kanTaBort,
  onBekraftaTaBort,
}: {
  sparadVisas: boolean
  kanTaBort: boolean
  onBekraftaTaBort: () => void
}) => {
  const [bekraftar, setBekraftar] = useState(false)
  return (
    <div className={styles.fot}>
      <span className={styles.status} aria-live="polite">
        {sparadVisas ? 'Sparat' : ''}
      </span>
      {kanTaBort && !bekraftar && (
        <button type="button" className={styles.taBort} onClick={() => setBekraftar(true)}>
          Ta bort
        </button>
      )}
      {kanTaBort && bekraftar && (
        <span className={styles.confirm}>
          <span className={styles.confirmQuestion}>Ta bort anteckningen?</span>
          <button type="button" className={styles.confirmYes} onClick={onBekraftaTaBort}>
            Ta bort
          </button>
          <button type="button" className={styles.taBort} onClick={() => setBekraftar(false)}>
            Avbryt
          </button>
        </span>
      )}
    </div>
  )
}

/** Bottom sheet for a note tied to a room or a text. Autosaves via
 * onChange (every change reaches the store and localStorage immediately); »Sparat« shows
 * quietly a moment after typing has stopped (spec Autosave — subtle, no
 * spinner). The field only opens on the user's request, never automatically. */
export const NotesSheet = ({ title, value, onChange, onClose, onDelete }: Props) => {
  const stabilt = useDebounced(value, 800)
  const sparadVisas = value.trim().length > 0 && stabilt === value
  const removeRemove = () => {
    onDelete?.()
    onClose()
  }
  return (
    <BottomSheet label="Anteckningar" title={title} onClose={onClose}>
      <label htmlFor="anteckningstext" className="srOnly">
        Din anteckning
      </label>
      <textarea
        id="anteckningstext"
        className={styles.textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        placeholder="Skriv det du vill bära med dig."
      />
      <Foot
        sparadVisas={sparadVisas}
        kanTaBort={onDelete !== undefined && value.trim().length > 0}
        onBekraftaTaBort={removeRemove}
      />
    </BottomSheet>
  )
}
