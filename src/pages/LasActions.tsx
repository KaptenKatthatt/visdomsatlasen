import { BookmarkButton } from '../components/BookmarkButton'
import { PencilIcon } from '../components/Icons'
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
      <BookmarkButton marked={!!bookmarks[topicId]} onToggle={() => toggleBookmark(topicId)} />
      <button type="button" onClick={onOpenNotes} aria-label="Anteckningar" className="iconBtn">
        <PencilIcon />
      </button>
      <ReadingSettingsButton />
    </div>
  )
}
