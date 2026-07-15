import { useEffect } from 'react'

const GRUNDTITEL = 'Visdomsatlasen'

/**
 * Sätter dokumenttiteln till »<titel> · Visdomsatlasen« medan sidan är
 * monterad och återställer grundtiteln när den lämnas — så att flikar,
 * historik och skärmläsare kan skilja sidorna åt.
 */
export const useSidtitel = (titel: string | undefined): void => {
  useEffect(() => {
    document.title = titel ? `${titel} · ${GRUNDTITEL}` : GRUNDTITEL
    return () => {
      document.title = GRUNDTITEL
    }
  }, [titel])
}
