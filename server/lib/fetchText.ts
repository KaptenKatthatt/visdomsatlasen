// Fetches raw text (Gutenberg txt, XHTML …) with retries and backoff, like
// fetchJson but without JSON parsing.
export const fetchText = async (url: string, attempts = 4, timeoutMs = 30000): Promise<string> => {
  let readError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
      if (!response.ok) throw new Error(`HTTP ${response.status} för ${url}`)
      return await response.text()
    } catch (error) {
      readError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500))
      }
    }
  }
  throw readError instanceof Error ? readError : new Error(String(readError))
}
