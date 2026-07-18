import { Hono } from 'hono'
import { verifyIngestToken } from '../auth'
import { runIngest } from '../ingest/run'

export const ingestRouter = new Hono()

// POST /api/ingest — runs ingest (getbible on the VPS, fixture locally). Only
// requests with `Authorization: Bearer <INGEST_TOKEN>` get through, just like
// newsAgg's /api/update. A browser can't set the header cross-origin, so no
// separate CSRF check is needed.
ingestRouter.post('/', async (c) => {
  if (!verifyIngestToken(c.req.header('Authorization') ?? null)) {
    return c.text('Unauthorized', 401)
  }
  const body = await c.req.json<{ works?: string[] }>().catch(() => ({}) as { works?: string[] })
  const only = Array.isArray(body.works) ? body.works : undefined
  const results = await runIngest(only)
  return c.json({ results })
})
