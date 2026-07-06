import { readFileSync } from 'node:fs'
import path from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono, type Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { config } from './config'
import { SESSION_COOKIE, verifyBasicAuth, verifyIngestToken, verifySessionToken } from './auth'
import { loginRouter } from './login'
import { libraryRouter } from './api/library'
import { ingestRouter } from './api/ingest'
import { runMissingIngest } from './ingest/run'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Webbläsare som laddar en sida (inte fetch/XHR) skickas till inloggnings-
// formuläret. Sec-Fetch-Dest sätts bara över https/localhost, så Accept är
// fallback för tailnet-adressen (som newsAgg).
const isDocumentRequest = (c: Context): boolean => {
  if (c.req.header('sec-fetch-dest') === 'document') return true
  return c.req.header('accept')?.includes('text/html') ?? false
}

const isSameOrigin = (c: Context): boolean => {
  const origin = c.req.header('origin')
  if (!origin) return false
  try {
    return new URL(origin).host === (c.req.header('host') ?? '')
  } catch {
    return false
  }
}

// Cron/CLI: bearer-token på POST /api/ingest släpps förbi (utan CSRF-kontroll,
// eftersom en sådan klient inte skickar Origin), precis som newsAggs /api/update.
const isIngestTokenCall = (c: Context, authz: string | null): boolean =>
  c.req.path === '/api/ingest' && c.req.method === 'POST' && verifyIngestToken(authz)

// Svar för oautentiserade anrop: sidladdningar i webbläsare skickas till
// inloggningsformuläret (som Proton Pass kan autofylla, till skillnad från basic
// auth-dialogen); övriga får 401 med basic auth-utmaning för curl/cron.
const rejectUnauthenticated = (c: Context): Response => {
  if (c.req.method === 'GET' && !c.req.header('Authorization') && isDocumentRequest(c)) {
    const from = c.req.path + new URL(c.req.url).search
    const target = from === '/' ? '/login' : `/login?from=${encodeURIComponent(from)}`
    return c.redirect(target)
  }
  return c.text('Unauthorized', 401, { 'WWW-Authenticate': 'Basic realm="Visdomsatlasen"' })
}

const app = new Hono()

// Inloggningssidan och dess POST är publika (annars går det aldrig att logga
// in). Registreras före auth-middlewaren så den släpps förbi.
app.route('/login', loginRouter)

// Allt annat bakom auth: sessionscookie (satt av formuläret) eller basic auth
// (curl/cron). Ingest får bearer-token-bypass så cron kan köra utan lösenord.
app.use('*', async (c, next) => {
  const authz = c.req.header('Authorization') ?? null
  if (isIngestTokenCall(c, authz)) return next()

  if (!verifySessionToken(getCookie(c, SESSION_COOKIE)) && !verifyBasicAuth(authz)) {
    return rejectUnauthenticated(c)
  }
  // CSRF: webbläsaren auto-skickar sessionscookien, så en extern sajt skulle
  // annars kunna trigga muterande anrop mot tailnet-adressen. Kräv same-origin
  // för muterande metoder (bearer-token-klienter gick redan förbi ovan).
  if (MUTATING_METHODS.has(c.req.method) && !isSameOrigin(c)) {
    return c.text('Forbidden', 403)
  }
  return next()
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
