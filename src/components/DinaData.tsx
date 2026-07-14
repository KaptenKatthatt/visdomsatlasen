import { useState } from 'react'
import { findTopic } from '../content/topics'
import {
  lasImport,
  tillExport,
  tillMarkdown,
  type PersonligaSamlingar,
  type PersonligExport,
} from '../lib/dataflytt'
import { hittaRumViaId, hittaVandringViaId } from '../lib/innehall'
import type { Ursprung } from '../lib/personligt'
import { useAtlas } from '../lib/store'
import styles from './DinaData.module.css'

// Läsbara titlar för exportens anteckningar och sparade poster, per ursprung.
const titelFor = (typ: Ursprung, id: string): string | undefined => {
  if (typ === 'rum') return hittaRumViaId(id)?.titel
  if (typ === 'vandring') return hittaVandringViaId(id)?.titel
  return findTopic(id)?.title
}

// Laddar ner en textfil via en objekt-URL och ett osynligt ankare.
const laddaNer = (innehåll: string, filnamn: string, mediatyp: string): void => {
  const blob = new Blob([innehåll], { type: mediatyp })
  const url = URL.createObjectURL(blob)
  const ankare = document.createElement('a')
  ankare.href = url
  ankare.download = filnamn
  ankare.click()
  URL.revokeObjectURL(url)
}

const lasImportSäkert = (text: string): PersonligExport | null => {
  try {
    return lasImport(JSON.parse(text))
  } catch {
    return null
  }
}

/** Rensa lokal data: en enkel bekräftelse som räknar upp exakt vad som försvinner
 * och pekar på export först, så rensningen aldrig blir en överraskning. */
const Rensning = ({ onRensa }: { onRensa: () => void }) => {
  const [bekräftar, setBekräftar] = useState(false)
  if (!bekräftar)
    return (
      <button type="button" className={styles.knapp} onClick={() => setBekräftar(true)}>
        Rensa lokal data
      </button>
    )
  return (
    <div className={styles.rensning}>
      <p className={styles.rensText}>
        Detta tar bort alla anteckningar, sparade rum och vandringar, bokmärken och läshistorik
        från den här enheten. Utseendet behålls. Exportera först om du vill spara en kopia.
      </p>
      <div className={styles.rad}>
        <button
          type="button"
          className={styles.knapp}
          onClick={() => {
            onRensa()
            setBekräftar(false)
          }}
        >
          Ta bort allt
        </button>
        <button type="button" className={styles.knapp} onClick={() => setBekräftar(false)}>
          Avbryt
        </button>
      </div>
    </div>
  )
}

/** Dina data (notes-and-saved.md, Export/Import): exportera personlig data i
 * öppna format, importera tillbaka och rensa lokalt — läsarens reflektioner ska
 * aldrig låsas in. Personlig data behandlas aldrig av AI och lämnar aldrig
 * enheten utom när läsaren själv exporterar den. */
export const DinaData = () => {
  const store = useAtlas()
  const [fel, setFel] = useState<string | undefined>(undefined)

  const bygg = (): PersonligExport => {
    const samlingar: PersonligaSamlingar = {
      anteckningar: store.anteckningar,
      sparadeRum: store.sparadeRum,
      sparadeVandringar: store.sparadeVandringar,
      bookmarks: store.bookmarks,
      chapterBookmarks: store.chapterBookmarks,
    }
    return tillExport(samlingar, titelFor, new Date().toISOString())
  }
  const stämpel = new Date().toISOString().slice(0, 10)

  const importera = async (fil: File): Promise<void> => {
    const data = lasImportSäkert(await fil.text())
    if (data === null) {
      setFel('Filen kunde inte läsas.')
      return
    }
    store.importeraPersonligt(data)
    setFel(undefined)
  }

  return (
    <div>
      <div className={styles.rad}>
        <button
          type="button"
          className={styles.knapp}
          onClick={() => laddaNer(JSON.stringify(bygg(), null, 2), `visdomsatlasen-${stämpel}.json`, 'application/json')}
        >
          Exportera
        </button>
        <button
          type="button"
          className={styles.knapp}
          onClick={() => laddaNer(tillMarkdown(bygg()), `visdomsatlasen-${stämpel}.md`, 'text/markdown')}
        >
          Exportera som text
        </button>
        <label className={styles.knapp}>
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
      <Rensning onRensa={store.rensaPersonligt} />
    </div>
  )
}
