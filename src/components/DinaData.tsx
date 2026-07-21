import { useState } from 'react'
import { findTopic } from '../content/topics'
import { toExport, toMarkdown, type PersonalExport } from '../lib/dataTransfer'
import { findRoomById, findPathById } from '../lib/content'
import type { Origin } from '../lib/personal'
import { personalCollections, useAtlas } from '../lib/store'
import styles from './DinaData.module.css'

// Readable titles for the export's notes and saved entries, by origin.
const titleFor = (type: Origin, id: string): string | undefined => {
  if (type === 'room') return findRoomById(id)?.title
  if (type === 'path') return findPathById(id)?.title
  return findTopic(id)?.title
}

// Downloads a text file via an object URL and an invisible anchor.
const download = (content: string, filnamn: string, mediatyp: string): void => {
  const blob = new Blob([content], { type: mediatyp })
  const url = URL.createObjectURL(blob)
  const ankare = document.createElement('a')
  ankare.href = url
  ankare.download = filnamn
  ankare.click()
  // Defer the revoke: some browsers (Safari/mobile) abort the
  // download if the object URL is revoked synchronously before it's read.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Clear local data: a simple confirmation that lists exactly what will disappear
 * and points to export first, so clearing is never a surprise. */
const Rensning = ({ onClear }: { onClear: () => void }) => {
  const [confirming, setConfirming] = useState(false)
  if (!confirming)
    return (
      <button type="button" className={styles.button} onClick={() => setConfirming(true)}>
        Rensa lokal data
      </button>
    )
  return (
    <div className={styles.rensning}>
      <p className={styles.rensText}>
        Detta tar bort alla anteckningar, sparade rum och vandringar, bokmärken och läshistorik
        från den här enheten. Utseendet behålls. Exportera först om du vill spara en kopia.
      </p>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            onClear()
            setConfirming(false)
          }}
        >
          Ta bort allt
        </button>
        <button type="button" className={styles.button} onClick={() => setConfirming(false)}>
          Avbryt
        </button>
      </div>
    </div>
  )
}

/** Your data (notes-and-saved.md): export personal data as text and clear it
 * locally — the reader's reflections should never be locked in. Personal data is
 * never processed by AI and never leaves the device except when the reader exports
 * it themselves. */
export const DinaData = () => {
  const store = useAtlas()

  const bygg = (): PersonalExport =>
    toExport(personalCollections(store), titleFor, new Date().toISOString())
  const stamp = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.button}
          onClick={() => download(toMarkdown(bygg()), `visdomsatlasen-${stamp}.md`, 'text/markdown')}
        >
          Exportera som text
        </button>
      </div>
      <Rensning onClear={store.clearPersonal} />
    </div>
  )
}
