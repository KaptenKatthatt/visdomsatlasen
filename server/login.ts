import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSessionToken,
  credentialsMatch,
  verifySessionToken,
} from './auth'

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Bara interna paths duger som redirect-mål — annars kan ett manipulerat
// ?from= skicka användaren till en extern sajt efter inloggning (som newsAgg).
const safeRedirectTarget = (value: string | undefined): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

const styles = `
:root {
  --paper: #faf6ed; --desk: #ece4d2; --ink: #2b251b;
  --soft: #8b7f6a; --faint: rgba(43, 37, 27, 0.16); --accent: #772f35;
}
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #1c1813; --desk: #12100b; --ink: #e9e0cc;
    --soft: #9a8e7b; --faint: rgba(233, 224, 204, 0.17); --accent: #c4878b;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; min-height: 100dvh; display: flex; align-items: center;
  justify-content: center; padding: 24px; background-color: var(--desk);
  color: var(--ink); font-family: 'EB Garamond', Georgia, serif;
  -webkit-font-smoothing: antialiased;
}
.card {
  width: 100%; max-width: 360px; background-color: var(--paper);
  border: 1px solid var(--faint); border-radius: 14px;
  box-shadow: 0 0 48px rgba(30, 22, 10, 0.1); padding: 32px 28px;
}
h1 { margin: 0 0 4px; font-size: 28px; font-weight: 600; letter-spacing: 0.01em; }
.sub { margin: 0 0 24px; color: var(--soft); font-size: 16px; }
form { display: flex; flex-direction: column; }
label { font-size: 14px; color: var(--soft); margin-bottom: 6px; }
input {
  font-size: 17px; padding: 10px 12px; margin-bottom: 18px; color: var(--ink);
  background-color: var(--desk); border: 1px solid var(--faint);
  border-radius: 8px; font-family: inherit;
}
input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.error { margin: 0 0 16px; color: var(--accent); font-size: 15px; }
button {
  margin-top: 4px; font-size: 17px; font-family: inherit; padding: 11px 16px;
  color: var(--paper); background-color: var(--accent); border: none;
  border-radius: 8px; cursor: pointer; transition: opacity 0.2s;
}
button:hover { opacity: 0.85; }
`

const renderLoginPage = (opts: { from?: string; error?: string }): string => {
  const fromField = opts.from
    ? `<input type="hidden" name="from" value="${escapeHtml(opts.from)}" />`
    : ''
  const errorNote = opts.error ? `<p class="error" role="alert">${escapeHtml(opts.error)}</p>` : ''
  return `<!doctype html>
<html lang="sv">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#faf6ed" />
<link rel="icon" type="image/svg+xml" href="/icon.svg" />
<title>Logga in – Visdomsatlasen</title>
<style>${styles}</style>
</head>
<body>
<main class="card">
<h1>Visdomsatlasen</h1>
<p class="sub">Logga in för att vandra bland texterna.</p>
<form method="post" action="/login">
${fromField}
<label for="username">Användarnamn</label>
<input id="username" name="username" type="text" autocomplete="username" required autofocus />
<label for="password">Lösenord</label>
<input id="password" name="password" type="password" autocomplete="current-password" required />
${errorNote}
<button type="submit">Logga in</button>
</form>
</main>
</body>
</html>`
}

export const loginRouter = new Hono()

// Redan inloggad ⇒ vidare till appen; annars visa formuläret.
loginRouter.get('/', (c) => {
  if (verifySessionToken(getCookie(c, SESSION_COOKIE))) return c.redirect('/')
  return c.html(renderLoginPage({ from: c.req.query('from') }))
})

loginRouter.post('/', async (c) => {
  const body = await c.req.parseBody()
  const username = typeof body['username'] === 'string' ? body['username'] : ''
  const password = typeof body['password'] === 'string' ? body['password'] : ''
  const from = typeof body['from'] === 'string' ? body['from'] : undefined

  if (!credentialsMatch(username, password)) {
    return c.html(renderLoginPage({ from, error: 'Fel användarnamn eller lösenord.' }), 401)
  }
  const token = createSessionToken()
  if (!token) {
    return c.html(renderLoginPage({ from, error: 'Inloggning är inte konfigurerad på servern.' }), 500)
  }
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
    // secure utelämnas: appen nås över http via tailnet (WireGuard krypterar).
  })
  return c.redirect(safeRedirectTarget(from))
})
