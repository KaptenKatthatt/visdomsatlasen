import { Hono } from 'hono'
import { verifyIngestToken } from '../auth'
import { runIngest } from '../ingest/run'

export const ingestRouter = new Hono()

// POST /api/ingest — kör ingest (getbible på VPS, fixture lokalt). Bara anrop
// med `Authorization: Bearer <INGEST_TOKEN>` släpps förbi, precis som newsAggs
// /api/update. En webbläsare kan inte sätta headern cross-origin, så ingen
// separat CSRF-kontroll behövs.
ingestRouter.post('/', async (c) => {
  if (!verifyIngestToken(c.req.header('Authorization') ?? null)) {
    return c.text('Unauthorized', 401)
  }
  const body = await c.req.json<{ works?: string[] }>().catch(() => ({}) as { works?: string[] })
  const only = Array.isArray(body.works) ? body.works : undefined
  const results = await runIngest(only)
  return c.json({ results })
})
