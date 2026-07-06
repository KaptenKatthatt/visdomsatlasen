import { Hono } from 'hono'
import { runIngest } from '../ingest/run'

export const ingestRouter = new Hono()

// POST /api/ingest — kör ingest (getbible på VPS, fixture lokalt). Skyddas av
// bearer-token i auth-middlewaren, precis som newsAggs /api/update.
ingestRouter.post('/', async (c) => {
  const body = await c.req.json<{ works?: string[] }>().catch(() => ({}) as { works?: string[] })
  const only = Array.isArray(body.works) ? body.works : undefined
  const results = await runIngest(only)
  return c.json({ results })
})
