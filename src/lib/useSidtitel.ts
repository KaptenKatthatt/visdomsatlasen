import { useEffect } from 'react'

const GRUNDTITEL = 'Visdomsatlasen'

/**
 * Sets the document title to »<title> · Visdomsatlasen« while the page is
 * mounted and restores the base title when it's left — so that tabs,
 * history and screen readers can tell the pages apart.
 */
export const useSidtitel = (title: string | undefined): void => {
  useEffect(() => {
    document.title = title ? `${title} · ${GRUNDTITEL}` : GRUNDTITEL
    return () => {
      document.title = GRUNDTITEL
    }
  }, [title])
}
