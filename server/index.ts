import { readFileSync } from 'node:fs'
import path from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { config } from './config'
import { libraryRouter } from './api/library'
import { ingestRouter } from './api/ingest'
import { mountAccessGate } from './gate'
import { runMissingIngest } from './ingest/run'

const app = new Hono()

// Phase 14 (analytics.md): the server's technical minimum. Unexpected errors are logged to
// the server log (no engagement, no third party, no personal text — just
// the error and the path that was hit) and the reader gets a clean, calm response.
app.onError((err, c) => {
  console.error('[server] fel:', c.req.method, new URL(c.req.url).pathname, '—', err.message)
  return c.json({ error: 'Något gick fel på servern.' }, 500)
})

// Tester mode: if ACCESS_CODE is set, a shared code hides the whole app (SPA + /api)
// behind a code page. Mounted first so it covers both static files and the API.
// Without the code the gate is off — the server is then reachable only via Tailscale
// (WireGuard) without a login, as before.
mountAccessGate(app, config.accessCode)

// No login beyond the tester code: all content is public domain and no
// personal data lives on the server (bookmarks and notes live in the browser's
// localStorage). The only writing endpoint, POST /api/ingest, is protected separately
// by INGEST_TOKEN in the ingest router.
app.route('/api/library', libraryRouter)
app.route('/api/ingest', ingestRouter)

// Static SPA files, with a fallback to index.html for client routes.
const staticRoot = path.relative(process.cwd(), config.staticDir) || '.'
app.use('/*', serveStatic({ root: staticRoot }))

// Read index.html once at startup (it's immutable after the build) instead
// of on every unhandled request. Null if the SPA isn't built.
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

// Fill in works missing from the database (e.g. after a new work has been added
// and deployed) in the background. Doesn't block startup. AUTO_INGEST=off disables it.
if (process.env['AUTO_INGEST'] !== 'off') {
  void runMissingIngest()
    .then((results) => {
      if (results.length > 0) console.log('[auto-ingest]', JSON.stringify(results))
    })
    .catch((error: unknown) => {
      console.error('[auto-ingest] fel:', error instanceof Error ? error.message : String(error))
    })
}
