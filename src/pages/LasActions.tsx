import { BookmarkIcon, MoonIcon, PencilIcon } from '../components/Icons'
import { useAtlas } from '../lib/store'
import styles from './LasPage.module.css'

type Props = {
  topicId: string
  onOpenNotes: () => void
}

/** Right-side actions in the reading top bar: bookmark, notes, dark mode. */
export const LasActions = ({ topicId, onOpenNotes }: Props) => {
  const { bookmarks, toggleBookmark, toggleDark } = useAtlas()
  return (
    <div className={styles.actions}>
      <button
        type="button"
        onClick={() => toggleBookmark(topicId)}
        aria-label="Bokmärke"
        aria-pressed={!!bookmarks[topicId]}
        className="iconBtn"
      >
        <BookmarkIcon filled={!!bookmarks[topicId]} />
      </button>
      <button type="button" onClick={onOpenNotes} aria-label="Anteckningar" className="iconBtn">
        <PencilIcon />
      </button>
      <button type="button" onClick={toggleDark} aria-label="Mörkt läge" className="iconBtn">
        <MoonIcon />
      </button>
    </div>
  )
}
