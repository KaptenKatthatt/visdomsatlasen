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
