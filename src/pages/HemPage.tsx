import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { Theme } from '../content/editorial/schema'
import { selectRoom } from '../lib/roomSelection'
import { useAtlas } from '../lib/store'
import { report } from '../lib/telemetry'
import { thresholdThemes } from '../lib/homeData'
import { useSidtitel } from '../lib/useSidtitel'
import styles from './HemPage.module.css'

/** Tröskeln (home-and-entry.md): en fråga, några themes, ett val — sedan
 * kliver gränssnittet undan. Inget datum, ingen aktivitet, inget dagligt
 * innehåll; tröskeln är likadan varje gång och börjar alltid i nuet.
 *
 * Prestanda (fas 13): hemskärmen laddar bara temana (troskeldata.ts), aldrig
 * hela innehållssamlingen. Rummen — brödtext, sources, allt — hämtas först när
 * ett tema väljs, via en dynamisk import. Chunken är oftast redan precachad av
 * service-workern, så steget märks knappt; läsrummet delar samma chunk. */
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
      // Innehållschunken gick inte att hämta (t.ex. offline före första cachning).
      // Släpp knappen igen så valet kan göras om — inget kraschar, inget hänger.
      report({ type: 'sidladdningsfel', resurs: 'innehall' })
    }
    setVäljer(false)
  }
  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <div className={styles.hero}>
        <h1 className={styles.fraga}>Vad vill du bära med dig idag?</h1>
        <p className={styles.stod}>Välj en tanke att stanna hos en stund.</p>
      </div>
      <div className={styles.themes}>
        {thresholdThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={styles.tema}
            onClick={() => void selectTheme(theme)}
          >
            {theme.label}
          </button>
        ))}
      </div>
      <p role="status" className={styles.tomt}>
        {tomtVal ? 'Det finns inget färdigt rum här ännu.' : ''}
      </p>
    </div>
  )
}
