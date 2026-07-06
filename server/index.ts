import { readFileSync } from 'node:fs'
import path from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { config } from './config'
import { verifyBasicAuth, verifyIngestToken } from './auth'
import { libraryRouter } from './api/library'
import { ingestRouter } from './api/ingest'

const app = new Hono()

// Allt bakom basic auth (appen körs Tailscale-only, som newsAgg). Ingest får
// bearer-token-bypass så cron kan köra utan lösenord.
app.use('*', async (c, next) => {
  const authz = c.req.header('Authorization') ?? null
  const isIngest = c.req.path === '/api/ingest' && c.req.method === 'POST'
  if (isIngest && verifyIngestToken(authz)) return next()
  if (verifyBasicAuth(authz)) return next()
  return c.text('Unauthorized', 401, { 'WWW-Authenticate': 'Basic realm="Visdomsatlasen"' })
})

app.route('/api/library', libraryRouter)
app.route('/api/ingest', ingestRouter)

// Statiska SPA-filer, med fallback till index.html för klientrutter.
const staticRoot = path.relative(process.cwd(), config.staticDir) || '.'
app.use('/*', serveStatic({ root: staticRoot }))

// Läs index.html en gång vid start (den är oföränderlig efter bygget) i stället
// för vid varje obesvarad request. Null om SPA:t inte är byggt.
const indexHtml = ((): string | null => {
  try {
    return readFileSync(path.join(config.staticDir, 'index.html'), 'utf-8')
  } catch {
    return null
  }
})()
app.get('*', (c) =>
  indexHtml ? c.html(indexHtml) : c.text('SPA:t är inte byggt (kör `npm run build`).', 404),
)

serve({ fetch: app.fetch, port: config.port, hostname: config.host }, (info) => {
  console.log(`Visdomsatlasen lyssnar på ${info.address}:${info.port}`)
})
