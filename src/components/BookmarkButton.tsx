import type { CSSProperties } from 'react'
import { BookmarkIcon } from './Icons'

type Props = {
  marked: boolean
  onToggle: () => void
  style?: CSSProperties
}

/** Presentational button for a bookmark — shared by the topic and chapter readers
 * so the icon, a11y attributes and styling stay in sync everywhere. */
export const BookmarkButton = ({ marked, onToggle, style }: Props) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label="Bokmärke"
    aria-pressed={marked}
    className="iconBtn"
    style={style}
  >
    <BookmarkIcon filled={marked} />
  </button>
)
