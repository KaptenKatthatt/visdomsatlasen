import { createHash, timingSafeEqual } from 'node:crypto'
import { config } from './config'

// Jämför via SHA-256-hashar: konstant tid oavsett stränglängd (som newsAgg).
const constantTimeEquals = (a: string, b: string): boolean => {
  const da = createHash('sha256').update(a, 'utf-8').digest()
  const db = createHash('sha256').update(b, 'utf-8').digest()
  return timingSafeEqual(da, db)
}

const credentialsMatch = (user: string, pass: string): boolean => {
  const { user: expUser, pass: expPass } = config.auth
  // Ingen inloggning konfigurerad ⇒ neka (säkert som standard, som newsAgg).
  if (!expUser || !expPass) return false
  return constantTimeEquals(user, expUser) && constantTimeEquals(pass, expPass)
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
