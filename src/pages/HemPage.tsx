import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { Tema } from '../content/redaktion/schema'
import { allaRum, troskelTeman } from '../lib/innehall'
import { valjRum } from '../lib/rumsval'
import { useAtlas } from '../lib/store'
import styles from './HemPage.module.css'

/** Tröskeln (home-and-entry.md): en fråga, några teman, ett val — sedan
 * kliver gränssnittet undan. Inget datum, ingen aktivitet, inget dagligt
 * innehåll; tröskeln är likadan varje gång och börjar alltid i nuet. */
export const HemPage = () => {
  const navigate = useNavigate()
  const { senastLastaRum } = useAtlas()
  const [tomtVal, setTomtVal] = useState(false)
  const valjTema = (tema: Tema) => {
    const rum = valjRum(tema, allaRum, senastLastaRum)
    if (rum) void navigate({ to: '/rum/$slug', params: { slug: rum.slug } })
    else setTomtVal(true)
  }
  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <div className={styles.hero}>
        <h1 className={styles.fraga}>Vad vill du bära med dig idag?</h1>
        <p className={styles.stod}>Välj en tanke att stanna hos en stund.</p>
      </div>
      <div className={styles.teman}>
        {troskelTeman.map((tema) => (
          <button
            key={tema.id}
            type="button"
            className={styles.tema}
            onClick={() => valjTema(tema)}
          >
            {tema.etikett}
          </button>
        ))}
      </div>
      <p role="status" className={styles.tomt}>
        {tomtVal ? 'Det finns inget färdigt rum här ännu.' : ''}
      </p>
    </div>
  )
}
