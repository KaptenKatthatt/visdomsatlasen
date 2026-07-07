import { readFileSync } from 'node:fs'
import path from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { config } from './config'
import { libraryRouter } from './api/library'
import { ingestRouter } from './api/ingest'
import { runMissingIngest } from './ingest/run'

const app = new Hono()

// Ingen inloggning: servern nås bara via Tailscale (WireGuard), allt innehåll är
// public domain och ingen personlig data ligger på servern (bokmärken och
// anteckningar bor i webbläsarens localStorage). Läsning är därför öppen inom
// tailnet. Den enda skrivande endpointen, POST /api/ingest, skyddas separat av
// INGEST_TOKEN i ingest-routern.
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

// Fyll på verk som saknas i databasen (t.ex. efter att ett nytt verk lagts till
// och deployats) i bakgrunden. Blockerar inte uppstarten. AUTO_INGEST=off stänger av.
if (process.env['AUTO_INGEST'] !== 'off') {
  void runMissingIngest()
    .then((results) => {
      if (results.length > 0) console.log('[auto-ingest]', JSON.stringify(results))
    })
    .catch((error: unknown) => {
      console.error('[auto-ingest] fel:', error instanceof Error ? error.message : String(error))
    })
}
