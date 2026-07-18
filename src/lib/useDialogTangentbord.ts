import { useEffect, useRef, type RefObject } from 'react'

const FOKUSERBAR_VALJARE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/** Keyboard-focusable elements within the root, in document order. */
const fokuserbaraI = (rot: HTMLElement): HTMLElement[] =>
  Array.from(rot.querySelectorAll<HTMLElement>(FOKUSERBAR_VALJARE))

/** Keeps Tab/Shift+Tab cycling within the sheet. */
const trapTab = (ark: HTMLElement, händelse: KeyboardEvent) => {
  const fokuserbara = fokuserbaraI(ark)
  const first = fokuserbara.at(0)
  const sista = fokuserbara.at(-1)
  if (!first || !sista) {
    händelse.preventDefault()
    ark.focus()
    return
  }
  const active = document.activeElement
  if (händelse.shiftKey && (active === first || active === ark)) {
    händelse.preventDefault()
    sista.focus()
  } else if (!händelse.shiftKey && active === sista) {
    händelse.preventDefault()
    first.focus()
  }
}

/**
 * Modal keyboard handling for a sheet/dialog: moves focus into the sheet
 * on opening, closes on Escape, keeps Tab focus trapped within the sheet and
 * returns focus to the previously focused element on closing.
 * The sheet needs tabIndex={-1} to be able to receive the initial focus.
 */
export const useDialogTangentbord = (
  arkRef: RefObject<HTMLElement | null>,
  onStäng: () => void,
): void => {
  const closeRef = useRef(onStäng)
  useEffect(() => {
    closeRef.current = onStäng
  })
  // The trigger is stored in a ref that survives StrictMode remounting; on
  // remount focus is already in the sheet and must not overwrite the memory.
  const tidigareRef = useRef<Element | null>(null)

  useEffect(() => {
    const ark = arkRef.current
    if (!ark) return
    const active = document.activeElement
    if (!ark.contains(active)) tidigareRef.current = active
    ark.focus()
    const vidTangent = (händelse: KeyboardEvent) => {
      if (händelse.key === 'Escape') {
        closeRef.current()
      } else if (händelse.key === 'Tab') {
        trapTab(ark, händelse)
      }
    }
    document.addEventListener('keydown', vidTangent)
    return () => {
      document.removeEventListener('keydown', vidTangent)
      const tidigare = tidigareRef.current
      // Microtask: lets a concurrent inert cleanup go first, otherwise the
      // trigger may still be unreachable when focus should return. The sheet
      // remains in the DOM on StrictMode remounting — then nothing should happen.
      queueMicrotask(() => {
        if (!document.contains(ark) && tidigare instanceof HTMLElement) tidigare.focus()
      })
    }
  }, [arkRef])
}
