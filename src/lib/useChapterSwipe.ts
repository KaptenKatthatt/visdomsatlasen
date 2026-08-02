import { useEffect, useRef, type RefObject } from 'react'
import { chapterSwipeTarget } from './chapterSwipe'

const INTERACTIVE = 'a, button, input, select, textarea, [role="button"]'

export type ChapterSwipeOptions = {
  prev: number | null
  next: number | null
  onNavigate: (chapter: number) => void
}

/**
 * Horizontal swipe on `rootRef` opens the neighbour chapter (same as Föregående/Nästa).
 * Vertical scroll is untouched: decision happens on pointerup via threshold only.
 * Gestures that start on links/buttons are ignored so chrome stays clickable.
 */
export const useChapterSwipe = (
  rootRef: RefObject<HTMLElement | null>,
  { prev, next, onNavigate }: ChapterSwipeOptions,
): void => {
  const prevRef = useRef(prev)
  const nextRef = useRef(next)
  const navigateRef = useRef(onNavigate)
  useEffect(() => {
    prevRef.current = prev
    nextRef.current = next
    navigateRef.current = onNavigate
  })

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let startX = 0
    let startY = 0
    let tracking = false

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest(INTERACTIVE)) {
        tracking = false
        return
      }
      tracking = true
      startX = event.clientX
      startY = event.clientY
    }

    const onUp = (event: PointerEvent) => {
      if (!tracking) return
      tracking = false
      const target = chapterSwipeTarget({
        dx: event.clientX - startX,
        dy: event.clientY - startY,
        prev: prevRef.current,
        next: nextRef.current,
      })
      if (target !== null) navigateRef.current(target)
    }

    const onCancel = () => {
      tracking = false
    }

    root.addEventListener('pointerdown', onDown)
    root.addEventListener('pointerup', onUp)
    root.addEventListener('pointercancel', onCancel)
    return () => {
      root.removeEventListener('pointerdown', onDown)
      root.removeEventListener('pointerup', onUp)
      root.removeEventListener('pointercancel', onCancel)
    }
  }, [rootRef])
}
