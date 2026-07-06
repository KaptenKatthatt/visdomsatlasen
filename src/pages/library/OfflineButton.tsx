import { useState } from 'react'
import { downloadForOffline, type OfflineProgress } from '../../lib/offline'
import styles from './Bibliotek.module.css'

const label = (running: boolean, progress: OfflineProgress | null): string => {
  if (running && progress) return `Hämtar … ${progress.done}/${progress.total}`
  if (!running && progress) return `Klart – ${progress.done} kapitel hämtade`
  return 'Ladda ner för offline'
}

export const OfflineButton = () => {
  const [progress, setProgress] = useState<OfflineProgress | null>(null)
  const [running, setRunning] = useState(false)

  const start = async (): Promise<void> => {
    setRunning(true)
    try {
      await downloadForOffline(setProgress)
    } catch {
      // Sväljs: knappen återställs i finally och kan provas igen.
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className={styles.offline}>
      <p className={styles.offlineText}>
        Hämta hem alla texter så att de går att läsa utan uppkoppling.
      </p>
      <button
        type="button"
        className={styles.offlineBtn}
        onClick={() => void start()}
        disabled={running}
      >
        {label(running, progress)}
      </button>
    </div>
  )
}
