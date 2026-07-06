import { fetchWork, fetchWorks } from './api'

export type OfflineProgress = { done: number; total: number }

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
