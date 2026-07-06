// Hämtar rå text (Gutenberg-txt, XHTML …) med återförsök och backoff, som
// fetchJson men utan JSON-parsning.
export const fetchText = async (url: string, attempts = 4, timeoutMs = 30000): Promise<string> => {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
      if (!response.ok) throw new Error(`HTTP ${response.status} för ${url}`)
      return await response.text()
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500))
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}
