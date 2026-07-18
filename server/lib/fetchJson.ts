// Fetches JSON with a few retries and exponential backoff. Used by
// the network adapters (getbible and others). Per-attempt timeout via AbortSignal.
export const fetchJson = async (url: string, attempts = 4, timeoutMs = 30000): Promise<unknown> => {
  let readError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
      if (!response.ok) throw new Error(`HTTP ${response.status} för ${url}`)
      return await response.json()
    } catch (error) {
      readError = error
      if (attempt < attempts) {
        const waitMs = 2 ** attempt * 500
        await new Promise((resolve) => setTimeout(resolve, waitMs))
      }
    }
  }
  throw readError instanceof Error ? readError : new Error(String(readError))
}
