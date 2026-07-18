import { useEffect } from 'react'

const GRUNDTITEL = 'Visdomsatlasen'

/**
 * Sätter dokumenttiteln till »<title> · Visdomsatlasen« medan sidan är
 * monterad och återställer grundtiteln när den lämnas — så att flikar,
 * historik och skärmläsare kan skilja sidorna åt.
 */
export const useSidtitel = (title: string | undefined): void => {
  useEffect(() => {
    document.title = title ? `${title} · ${GRUNDTITEL}` : GRUNDTITEL
    return () => {
      document.title = GRUNDTITEL
    }
  }, [title])
}
