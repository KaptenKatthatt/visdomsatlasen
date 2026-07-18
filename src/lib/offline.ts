import { fetchWork, fetchWorks } from './api'
import { readJson, writeJson } from './storage'

export type OfflineProgress = { done: number; total: number }

// The name of the service worker's runtime cache (see runtimeCaching in vite.config.ts).
const CACHE_NAME = 'library-api'
// Key for the flag that marks a completed bulk download.
const STATE_KEY = 'offline-download'

type OfflineDownload = { chapters: number }

/**
 * Reads the number of chapters from a previously completed download, or null if none
 * has been done. An explicit flag (as opposed to counting cache entries) distinguishes a
 * real bulk download from individual chapters cached during ordinary reading, and is
 * read synchronously so the status survives a reload without flicker.
 */
export const readOfflineDownload = (): number | null =>
  readJson<OfflineDownload | null>(STATE_KEY, null)?.chapters ?? null

/** Saves (or clears, with null) the flag for a completed download. */
export const writeOfflineDownload = (chapters: number | null): void => {
  writeJson(STATE_KEY, chapters === null ? null : { chapters })
}

/** Deletes the offline download: empties the runtime cache and clears the flag. */
export const deleteOfflineDownload = async (): Promise<void> => {
  writeOfflineDownload(null)
  try {
    if (!('caches' in globalThis)) return
    const names = await caches.keys()
    await Promise.all(
      names.filter((name) => name.includes(CACHE_NAME)).map((name) => caches.delete(name)),
    )
  } catch {
    // Swallowed: if there's nothing to delete the app works anyway.
  }
}

// Collect all chapter URLs (work → books → chapters) via the metadata.
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
 * Fetches all chapters so the service worker's runtime cache fills up and the texts
 * can be read offline. Called while the device is connected (via Tailscale).
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
      // A failed chapter is skipped; the rest are cached anyway.
    }
    done += 1
    onProgress({ done, total: urls.length })
  }
}
