import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { Theme } from '../content/editorial/schema'
import { valjRum } from '../lib/rumsval'
import { useAtlas } from '../lib/store'
import { rapportera } from '../lib/telemetri'
import { troskelTeman } from '../lib/troskeldata'
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
  const { senastLastaRum } = useAtlas()
  const [tomtVal, setTomtVal] = useState(false)
  const [väljer, setVäljer] = useState(false)
  const valjTema = async (tema: Theme) => {
    if (väljer) return
    setVäljer(true)
    setTomtVal(false)
    try {
      const { allaRum } = await import('../lib/innehall')
      const rum = valjRum(tema, allaRum, senastLastaRum)
      if (rum) {
        void navigate({ to: '/rum/$slug', params: { slug: rum.slug } })
        return
      }
      setTomtVal(true)
    } catch {
      // Innehållschunken gick inte att hämta (t.ex. offline före första cachning).
      // Släpp knappen igen så valet kan göras om — inget kraschar, inget hänger.
      rapportera({ type: 'sidladdningsfel', resurs: 'innehall' })
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
        {troskelTeman.map((tema) => (
          <button
            key={tema.id}
            type="button"
            className={styles.tema}
            onClick={() => void valjTema(tema)}
          >
            {tema.label}
          </button>
        ))}
      </div>
      <p role="status" className={styles.tomt}>
        {tomtVal ? 'Det finns inget färdigt rum här ännu.' : ''}
      </p>
    </div>
  )
}
