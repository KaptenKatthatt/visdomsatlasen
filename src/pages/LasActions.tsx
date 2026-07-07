import { BookmarkIcon, PencilIcon } from '../components/Icons'
import { ReadingSettingsButton } from '../components/ReadingSettingsButton'
import { useAtlas } from '../lib/store'
import styles from './LasPage.module.css'

type Props = {
  topicId: string
  onOpenNotes: () => void
}

/** Right-side actions in the reading top bar: bookmark, notes, reading settings. */
export const LasActions = ({ topicId, onOpenNotes }: Props) => {
  const { bookmarks, toggleBookmark } = useAtlas()
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
      <ReadingSettingsButton />
    </div>
  )
}
