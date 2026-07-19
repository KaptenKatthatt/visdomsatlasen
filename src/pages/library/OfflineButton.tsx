import { useState } from 'react'
import {
  deleteOfflineDownload,
  downloadForOffline,
  readOfflineDownload,
  writeOfflineDownload,
  type OfflineProgress,
} from '../../lib/offline'
import styles from './Library.module.css'

const description = (hasDownload: boolean, downloaded: number | null): string =>
  hasDownload
    ? `Klart – ${downloaded} kapitel hämtade. Texterna går att läsa utan uppkoppling.`
    : 'Hämta hem alla texter så att de går att läsa utan uppkoppling.'

const actionLabel = (
  running: boolean,
  hasDownload: boolean,
  progress: OfflineProgress | null,
): string => {
  if (running && progress) return `Hämtar … ${progress.done}/${progress.total}`
  if (hasDownload) return 'Hämta igen'
  return 'Ladda ner för offline'
}

export const OfflineButton = () => {
  const [progress, setProgress] = useState<OfflineProgress | null>(null)
  const [running, setRunning] = useState(false)
  // Read synchronously from the flag on mount, so the status survives a reload.
  const [downloaded, setDownloaded] = useState<number | null>(readOfflineDownload)

  const start = async (): Promise<void> => {
    setRunning(true)
    let total = 0
    try {
      await downloadForOffline((p) => {
        total = p.total
        setProgress(p)
      })
      writeOfflineDownload(total)
      setDownloaded(total)
    } catch {
      // Swallowed: the button resets in finally and can be retried.
    } finally {
      setRunning(false)
    }
  }

  const remove = async (): Promise<void> => {
    await deleteOfflineDownload()
    setProgress(null)
    setDownloaded(null)
  }

  const hasDownload = !running && (downloaded ?? 0) > 0

  return (
    <div className={styles.offline}>
      <p className={styles.offlineText}>{description(hasDownload, downloaded)}</p>
      <div className={styles.offlineActions}>
        <button
          type="button"
          className={styles.offlineBtn}
          onClick={() => void start()}
          disabled={running}
        >
          {actionLabel(running, hasDownload, progress)}
        </button>
        {hasDownload && (
          <button
            type="button"
            className={styles.offlineBtnGhost}
            onClick={() => void remove()}
          >
            Radera nedladdning
          </button>
        )}
      </div>
    </div>
  )
}
