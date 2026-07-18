import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { Theme } from '../content/editorial/schema'
import { selectRoom } from '../lib/roomSelection'
import { useAtlas } from '../lib/store'
import { report } from '../lib/telemetry'
import { thresholdThemes } from '../lib/homeData'
import { useSidtitel } from '../lib/useSidtitel'
import styles from './HemPage.module.css'

/** The threshold (home-and-entry.md): one question, a few themes, one choice —
 * then the interface steps aside. No date, no activity, no daily
 * content; the threshold is the same every time and always starts in the present.
 *
 * Performance (phase 13): the home screen loads only the themes (troskeldata.ts),
 * never the whole content collection. The rooms — body text, sources, all of it —
 * are fetched only when a theme is chosen, via a dynamic import. The chunk is
 * usually already precached by the service worker; the reading room shares it. */
export const HemPage = () => {
  useSidtitel('Läsrummet')
  const navigate = useNavigate()
  const { recentRooms } = useAtlas()
  const [tomtVal, setTomtVal] = useState(false)
  const [väljer, setVäljer] = useState(false)
  const selectTheme = async (theme: Theme) => {
    if (väljer) return
    setVäljer(true)
    setTomtVal(false)
    try {
      const { allRooms } = await import('../lib/content')
      const room = selectRoom(theme, allRooms, recentRooms)
      if (room) {
        void navigate({ to: '/rum/$slug', params: { slug: room.slug } })
        return
      }
      setTomtVal(true)
    } catch {
      // The content chunk could not be fetched (e.g. offline before first caching).
      // Release the button again so the choice can be retried — nothing crashes, nothing hangs.
      report({ type: 'sidladdningsfel', resurs: 'innehall' })
    }
    setVäljer(false)
  }
  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <div className={styles.hero}>
        <h1 className={styles.question}>Vad vill du bära med dig idag?</h1>
        <p className={styles.support}>Välj en tanke att stanna hos en stund.</p>
      </div>
      <div className={styles.themes}>
        {thresholdThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={styles.theme}
            onClick={() => void selectTheme(theme)}
          >
            {theme.label}
          </button>
        ))}
      </div>
      <p role="status" className={styles.empty}>
        {tomtVal ? 'Det finns inget färdigt rum här ännu.' : ''}
      </p>
    </div>
  )
}
