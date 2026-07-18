import { useState } from 'react'
import { findTopic } from '../content/topics'
import { readImport, toExport, toMarkdown, type PersonalExport } from '../lib/dataTransfer'
import { findRoomById, findPathById } from '../lib/content'
import type { Origin } from '../lib/personal'
import { personalCollections, useAtlas } from '../lib/store'
import styles from './DinaData.module.css'

// Readable titles for the export's notes and saved entries, by origin.
const titelFor = (type: Origin, id: string): string | undefined => {
  if (type === 'room') return findRoomById(id)?.title
  if (type === 'path') return findPathById(id)?.title
  return findTopic(id)?.title
}

// Downloads a text file via an object URL and an invisible anchor.
const download = (innehåll: string, filnamn: string, mediatyp: string): void => {
  const blob = new Blob([innehåll], { type: mediatyp })
  const url = URL.createObjectURL(blob)
  const ankare = document.createElement('a')
  ankare.href = url
  ankare.download = filnamn
  ankare.click()
  // Defer the revoke: some browsers (Safari/mobile) abort the
  // download if the object URL is revoked synchronously before it's read.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

const readImportSafely = (text: string): PersonalExport | null => {
  try {
    return readImport(JSON.parse(text))
  } catch {
    return null
  }
}

/** Clear local data: a simple confirmation that lists exactly what will disappear
 * and points to export first, so clearing is never a surprise. */
const Rensning = ({ onRensa }: { onRensa: () => void }) => {
  const [bekräftar, setBekräftar] = useState(false)
  if (!bekräftar)
    return (
      <button type="button" className={styles.button} onClick={() => setBekräftar(true)}>
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
            onRensa()
            setBekräftar(false)
          }}
        >
          Ta bort allt
        </button>
        <button type="button" className={styles.button} onClick={() => setBekräftar(false)}>
          Avbryt
        </button>
      </div>
    </div>
  )
}

/** Your data (notes-and-saved.md, Export/Import): export personal data in
 * open formats, import it back and clear it locally — the reader's reflections should
 * never be locked in. Personal data is never processed by AI and never leaves
 * the device except when the reader exports it themselves. */
export const DinaData = () => {
  const store = useAtlas()
  const [fel, setFel] = useState<string | undefined>(undefined)

  const bygg = (): PersonalExport =>
    toExport(personalCollections(store), titelFor, new Date().toISOString())
  const stamp = new Date().toISOString().slice(0, 10)

  const importera = async (fil: File): Promise<void> => {
    const data = readImportSafely(await fil.text())
    if (data === null) {
      setFel('Filen kunde inte läsas.')
      return
    }
    store.importPersonal(data)
    setFel(undefined)
  }

  return (
    <div>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.button}
          onClick={() => download(JSON.stringify(bygg(), null, 2), `visdomsatlasen-${stamp}.json`, 'application/json')}
        >
          Exportera
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => download(toMarkdown(bygg()), `visdomsatlasen-${stamp}.md`, 'text/markdown')}
        >
          Exportera som text
        </button>
        <label className={styles.button}>
          Importera
          <input
            type="file"
            accept="application/json,.json"
            className={styles.dold}
            onChange={(event) => {
              const fil = event.target.files?.[0]
              event.target.value = ''
              if (fil) void importera(fil)
            }}
          />
        </label>
      </div>
      {fel !== undefined && <p className={styles.fel}>{fel}</p>}
      <Rensning onRensa={store.clearPersonal} />
    </div>
  )
}
