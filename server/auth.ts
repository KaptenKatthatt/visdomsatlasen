import { createHash, timingSafeEqual } from 'node:crypto'
import { config } from './config'

// Jämför via SHA-256-hashar: konstant tid oavsett stränglängd (som newsAgg).
const constantTimeEquals = (a: string, b: string): boolean => {
  const da = createHash('sha256').update(a, 'utf-8').digest()
  const db = createHash('sha256').update(b, 'utf-8').digest()
  return timingSafeEqual(da, db)
}

/** Verifierar `Authorization: Bearer <INGEST_TOKEN>` för ingest-anrop. */
export const verifyIngestToken = (header: string | null): boolean => {
  const token = config.ingestToken
  if (!token || !header || !header.startsWith('Bearer ')) return false
  return constantTimeEquals(header.slice(7), token)
}

/**
 * Verifierar en inskickad åtkomstkod (testarläget) mot den delade koden i
 * konstant tid. Koden tas som parameter så funktionen förblir ren och testbar.
 */
export const verifyAccessCode = (submitted: string, code: string): boolean => {
  if (!code || !submitted) return false
  return constantTimeEquals(submitted, code)
}

/**
 * Härledd cookie-token = SHA-256 av koden. Plaintext-koden lagras alltså aldrig
 * i cookien, och byte av koden ogiltigförklarar automatiskt gamla cookies.
 */
export const accessCookieValue = (code: string): string =>
  createHash('sha256').update(code, 'utf-8').digest('hex')

/** Verifierar en cookie mot den härledda token i konstant tid. */
export const verifyAccessCookie = (value: string | null, code: string): boolean => {
  if (!code || !value) return false
  return constantTimeEquals(value, accessCookieValue(code))
}
