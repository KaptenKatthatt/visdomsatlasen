import { type Context, Hono, type MiddlewareHandler } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { accessCookieValue, verifyAccessCode, verifyAccessCookie } from './auth'

// Testarläget: en delad kod gömmer hela appen (SPA + /api) bakom en enkel
// kod-sida. Rätt kod sätter en HttpOnly-cookie med en härledd token. Spärren
// aktiveras bara när en kod är konfigurerad (se server/index.ts) — utan kod är
// appen öppen som förr (dev + Tailscale-only).

const COOKIE = 'va_access'
const LOGIN_PATH = '/api/access'
const EN_MANAD = 60 * 60 * 24 * 30

/** Läser den inskickade koden ur ett formulär eller en JSON-kropp. */
const laesKod = async (c: Context): Promise<string> => {
  const type = c.req.header('Content-Type') ?? ''
  if (type.includes('application/json')) {
    const body = await c.req.json<{ code?: unknown }>().catch(() => ({}) as { code?: unknown })
    return typeof body.code === 'string' ? body.code : ''
  }
  const body = await c.req.parseBody().catch(() => ({}) as Record<string, unknown>)
  const code = body['code']
  return typeof code === 'string' ? code : ''
}

/** Minimal, mobilvänlig och emojifri kod-sida (inga externa beroenden). */
const kodSida = (fel: boolean): string => `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Visdomsatlasen</title>
<style>
  :root { color-scheme: light dark }
  * { box-sizing: border-box }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
    font: 16px/1.5 -apple-system, system-ui, sans-serif; padding: 24px;
    background: #faf8f4; color: #1a1a1a }
  @media (prefers-color-scheme: dark) { body { background: #14130f; color: #ece8df } }
  main { width: 100%; max-width: 22rem }
  h1 { font-size: 1.35rem; font-weight: 600; margin: 0 0 .25rem }
  p { margin: 0 0 1.5rem; color: #6b6b6b }
  label { display: block; font-size: .85rem; margin-bottom: .4rem }
  input { width: 100%; padding: .75rem; font-size: 1rem; border: 1px solid #bbb;
    border-radius: .5rem; background: transparent; color: inherit }
  button { width: 100%; margin-top: .9rem; padding: .8rem; font-size: 1rem;
    font-weight: 600; border: 0; border-radius: .5rem; background: #1a1a1a;
    color: #fff; cursor: pointer }
  @media (prefers-color-scheme: dark) { button { background: #ece8df; color: #14130f } }
  .fel { margin: 0 0 1rem; color: #b3261e; font-size: .9rem }
</style>
</head>
<body>
<main>
  <h1>Visdomsatlasen</h1>
  <p>Den här förhandsversionen är öppen för inbjudna testare.</p>
  ${fel ? '<p class="fel" role="alert">Fel kod. Försök igen.</p>' : ''}
  <form method="post" action="${LOGIN_PATH}">
    <label for="code">Åtkomstkod</label>
    <input id="code" name="code" type="password" autocomplete="off"
      autocapitalize="off" autocorrect="off" spellcheck="false" required autofocus>
    <button type="submit">Gå in</button>
  </form>
</main>
</body>
</html>`

/**
 * Bygger spärr-middleware för en given kod. Hanterar login-POST:en, kollar
 * cookien och serverar annars kod-sidan (för HTML-navigering) eller 401.
 */
export const createAccessGate = (accessCode: string): MiddlewareHandler => {
  const token = accessCookieValue(accessCode)
  return async (c, next) => {
    // Login: verifiera koden, sätt cookie, tillbaka till appen.
    if (c.req.method === 'POST' && c.req.path === LOGIN_PATH) {
      const submitted = await laesKod(c)
      if (verifyAccessCode(submitted, accessCode)) {
        setCookie(c, COOKIE, token, {
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
          path: '/',
          maxAge: EN_MANAD,
        })
        return c.redirect('/', 303)
      }
      return c.html(kodSida(true), 401)
    }

    // robots.txt släpps alltid igenom (säger ändå Disallow: /).
    if (c.req.path === '/robots.txt') return next()

    // Redan inne?
    if (verifyAccessCookie(getCookie(c, COOKIE) ?? null, accessCode)) return next()

    // Neka: HTML-navigering får kod-sidan, allt annat (t.ex. /api) får 401.
    const villHaHtml = (c.req.header('Accept') ?? '').includes('text/html')
    if (c.req.method === 'GET' && villHaHtml) return c.html(kodSida(false), 200)
    return c.text('Unauthorized', 401)
  }
}

/**
 * Monterar spärren på appen bara när en kod finns. Utan kod lämnas appen öppen
 * (dev + Tailscale-only, bakåtkompatibelt). Samlar den villkorade monteringen på
 * ett ställe så grenen kan testas.
 */
export const mountAccessGate = (app: Hono, accessCode: string | undefined): void => {
  if (accessCode) app.use('*', createAccessGate(accessCode))
}
