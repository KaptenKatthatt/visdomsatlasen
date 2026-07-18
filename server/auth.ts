import { createHash, timingSafeEqual } from 'node:crypto'
import { config } from './config'

// Compare via SHA-256 hashes: constant time regardless of string length (like newsAgg).
const constantTimeEquals = (a: string, b: string): boolean => {
  const da = createHash('sha256').update(a, 'utf-8').digest()
  const db = createHash('sha256').update(b, 'utf-8').digest()
  return timingSafeEqual(da, db)
}

/** Verifies `Authorization: Bearer <INGEST_TOKEN>` for ingest requests. */
export const verifyIngestToken = (header: string | null): boolean => {
  const token = config.ingestToken
  if (!token || !header || !header.startsWith('Bearer ')) return false
  return constantTimeEquals(header.slice(7), token)
}

/**
 * Verifies a submitted access code (tester mode) against the shared code in
 * constant time. The code is taken as a parameter so the function stays pure and testable.
 */
export const verifyAccessCode = (submitted: string, code: string): boolean => {
  if (!code || !submitted) return false
  return constantTimeEquals(submitted, code)
}

/**
 * Derived cookie token = SHA-256 of the code. The plaintext code is therefore never
 * stored in the cookie, and changing the code automatically invalidates old cookies.
 */
export const accessCookieValue = (code: string): string =>
  createHash('sha256').update(code, 'utf-8').digest('hex')

/** Verifies a cookie against the derived token in constant time. */
export const verifyAccessCookie = (value: string | null, code: string): boolean => {
  if (!code || !value) return false
  return constantTimeEquals(value, accessCookieValue(code))
}
