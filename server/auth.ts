import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { config } from './config'

// Sessionscookien sätts av inloggningsformuläret (server/login.ts) så att
// webbläsare slipper basic auth-dialogen — Proton Pass kan autofylla formuläret.
export const SESSION_COOKIE = 'visdomsatlasen_session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

// Jämför via SHA-256-hashar: konstant tid oavsett stränglängd (som newsAgg).
const constantTimeEquals = (a: string, b: string): boolean => {
  const da = createHash('sha256').update(a, 'utf-8').digest()
  const db = createHash('sha256').update(b, 'utf-8').digest()
  return timingSafeEqual(da, db)
}

/** Sant om användarnamn/lösenord matchar det konfigurerade paret. */
export const credentialsMatch = (user: string, pass: string): boolean => {
  const { user: expUser, pass: expPass } = config.auth
  // Ingen inloggning konfigurerad ⇒ neka (säkert som standard, som newsAgg).
  if (!expUser || !expPass) return false
  return constantTimeEquals(user, expUser) && constantTimeEquals(pass, expPass)
}

// Sessionsnyckeln härleds ur inloggningsuppgifterna, så ingen separat
// SESSION_SECRET behövs i .env — byts lösenordet blir alla sessioner ogiltiga.
const sessionKey = (): Buffer | null => {
  const { user, pass } = config.auth
  if (!user || !pass) return null
  return createHash('sha256').update(`visdomsatlasen-session-v1:${user}:${pass}`).digest()
}

/** Verifierar en `Authorization: Basic`-header mot ATLAS_USER/ATLAS_PASS. */
export const verifyBasicAuth = (header: string | null): boolean => {
  if (!header || !header.startsWith('Basic ')) return false
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8')
  // Bara första kolonet skiljer användarnamn från lösenord.
  const colon = decoded.indexOf(':')
  if (colon === -1) return false
  return credentialsMatch(decoded.slice(0, colon), decoded.slice(colon + 1))
}

/** Verifierar `Authorization: Bearer <INGEST_TOKEN>` för ingest-anrop. */
export const verifyIngestToken = (header: string | null): boolean => {
  const token = config.ingestToken
  if (!token || !header || !header.startsWith('Bearer ')) return false
  return constantTimeEquals(header.slice(7), token)
}

/** Skapar en signerad, tidsbegränsad sessionstoken. Null om ej konfigurerad. */
export const createSessionToken = (now = Date.now()): string | null => {
  const key = sessionKey()
  if (!key) return null
  const expiresAt = String(now + SESSION_TTL_MS)
  const signature = createHmac('sha256', key).update(expiresAt).digest('base64url')
  return `v1.${expiresAt}.${signature}`
}

/** Sant om token är korrekt signerad och inte har gått ut. */
export const verifySessionToken = (token: string | undefined, now = Date.now()): boolean => {
  if (!token) return false
  const key = sessionKey()
  if (!key) return false
  const [version, expiresAtRaw, signature] = token.split('.')
  if (version !== 'v1' || !expiresAtRaw || !signature) return false
  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt) || expiresAt < now) return false
  const expected = createHmac('sha256', key).update(expiresAtRaw).digest('base64url')
  return constantTimeEquals(signature, expected)
}
