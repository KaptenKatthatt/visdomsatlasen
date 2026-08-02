/** Minimum horizontal travel (px) before a swipe counts as chapter navigation. */
export const CHAPTER_SWIPE_THRESHOLD = 56

export type ChapterSwipeInput = {
  dx: number
  dy: number
  prev: number | null
  next: number | null
}

/**
 * Decides which chapter a completed pointer gesture should open.
 * Left swipe (negative dx) → next; right swipe → prev.
 * Returns null when the gesture is too short, mostly vertical, or has no neighbour.
 */
export const chapterSwipeTarget = ({
  dx,
  dy,
  prev,
  next,
}: ChapterSwipeInput): number | null => {
  if (Math.abs(dx) < CHAPTER_SWIPE_THRESHOLD) return null
  if (Math.abs(dx) <= Math.abs(dy)) return null
  if (dx < 0) return next
  return prev
}
