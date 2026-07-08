import type { CSSProperties } from 'react'
import { BookmarkIcon } from './Icons'

type Props = {
  marked: boolean
  onToggle: () => void
  style?: CSSProperties
}

/** Presentationsknappen för ett bokmärke — delas av ämnes- och kapitelläsarna
 * så ikon, a11y-attribut och stil hålls i synk på alla ställen. */
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
