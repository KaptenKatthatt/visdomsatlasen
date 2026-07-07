import { fetchWork, fetchWorks } from './api'
import { readJson, writeJson } from './storage'

export type OfflineProgress = { done: number; total: number }

// Namnet på service-workerns runtime-cache (se runtimeCaching i vite.config.ts).
const CACHE_NAME = 'library-api'
// Nyckel för flaggan som markerar en genomförd bulk-nedladdning.
const STATE_KEY = 'offline-download'

type OfflineDownload = { chapters: number }

/**
 * Läser antalet kapitel från en tidigare genomförd nedladdning, eller null om ingen
 * gjorts. En explicit flagga (till skillnad från att räkna cache-poster) skiljer en
 * riktig bulk-nedladdning från enstaka kapitel som cachats vid vanlig läsning, och
 * läses synkront så statusen överlever omladdning utan flimmer.
 */
export const readOfflineDownload = (): number | null =>
  readJson<OfflineDownload | null>(STATE_KEY, null)?.chapters ?? null

/** Sparar (eller nollar, med null) flaggan för genomförd nedladdning. */
export const writeOfflineDownload = (chapters: number | null): void => {
  writeJson(STATE_KEY, chapters === null ? null : { chapters })
}

/** Raderar offline-nedladdningen: tömmer runtime-cachen och nollar flaggan. */
export const deleteOfflineDownload = async (): Promise<void> => {
  writeOfflineDownload(null)
  try {
    if (!('caches' in globalThis)) return
    const names = await caches.keys()
    await Promise.all(
      names.filter((name) => name.includes(CACHE_NAME)).map((name) => caches.delete(name)),
    )
  } catch {
    // Sväljs: går inget att radera fungerar appen ändå.
  }
}

// Samla alla kapitel-URL:er (verk → böcker → kapitel) via metadatan.
const collectChapterUrls = async (): Promise<string[]> => {
  const { works } = await fetchWorks()
  const urls: string[] = []
  for (const work of works) {
    const { books } = await fetchWork(work.id)
    for (const book of books) {
      const id = encodeURIComponent(book.id)
      for (const n of book.chapters) {
        urls.push(`/api/library/books/${id}/chapters/${n}`)
      }
    }
  }
  return urls
}

/**
 * Hämtar hem alla kapitel så service-workerns runtime-cache fylls och texterna
 * går att läsa offline. Anropas medan enheten är ansluten (via Tailscale).
 */
export const downloadForOffline = async (
  onProgress: (progress: OfflineProgress) => void,
): Promise<void> => {
  const urls = await collectChapterUrls()
  let done = 0
  onProgress({ done, total: urls.length })
  for (const url of urls) {
    try {
      await fetch(url, { headers: { Accept: 'application/json' } })
    } catch {
      // Ett misslyckat kapitel hoppas över; resten cachas ändå.
    }
    done += 1
    onProgress({ done, total: urls.length })
  }
}
