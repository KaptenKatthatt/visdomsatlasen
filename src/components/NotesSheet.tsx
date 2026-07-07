import { BottomSheet } from './BottomSheet'
import styles from './NotesSheet.module.css'

type Props = {
  title: string
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

/** Bottom-sheet notebook attached to a topic in reading mode. */
export const NotesSheet = ({ title, value, onChange, onClose }: Props) => (
  <BottomSheet label="Anteckningar" title={title} onClose={onClose}>
    <textarea
      className={styles.textarea}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={7}
      placeholder="Tankar, frågor, invändningar…"
      autoFocus
    />
  </BottomSheet>
)
