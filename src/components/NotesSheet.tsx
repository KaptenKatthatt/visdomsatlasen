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

/** Sheetens fot: stilla autospar-status till vänster, radering till höger.
 * Raderingen kräver en enkel bekräftelse på place — innehållet är personligt
 * och kanske inte återställbart (spec Deleting Notes). Ingen window.confirm. */
const Fot = ({
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
        <span className={styles.bekrafta}>
          <span className={styles.bekraftaFraga}>Ta bort anteckningen?</span>
          <button type="button" className={styles.bekraftaJa} onClick={onBekraftaTaBort}>
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

/** Bottenark för en anteckning kopplad till ett rum eller en text. Autospar via
 * onChange (varje ändring når store och localStorage direkt); »Sparat« visas
 * stilla en stund efter att skrivandet stannat (spec Autosave — subtil, ingen
 * spinner). Fältet öppnas bara på användarens begäran, aldrig automatiskt. */
export const NotesSheet = ({ title, value, onChange, onClose, onDelete }: Props) => {
  const stabilt = useDebounced(value, 800)
  const sparadVisas = value.trim().length > 0 && stabilt === value
  const taBort = () => {
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
      <Fot
        sparadVisas={sparadVisas}
        kanTaBort={onDelete !== undefined && value.trim().length > 0}
        onBekraftaTaBort={taBort}
      />
    </BottomSheet>
  )
}
