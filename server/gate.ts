import { type Context, Hono, type MiddlewareHandler } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { accessCookieValue, verifyAccessCode, verifyAccessCookie } from './auth'

// Tester mode: a shared code hides the whole app (SPA + /api) behind a simple
// code page. The correct code sets an HttpOnly cookie with a derived token. The gate
// is only enabled when a code is configured (see server/index.ts) — without a code the
// app is open as before (dev + Tailscale-only).

const COOKIE = 'va_access'
const LOGIN_PATH = '/api/access'
const ONE_MONTH = 60 * 60 * 24 * 30

/** Reads the submitted code from a form or a JSON body. */
const readCode = async (c: Context): Promise<string> => {
  const type = c.req.header('Content-Type') ?? ''
  if (type.includes('application/json')) {
    const body = await c.req.json<{ code?: unknown }>().catch(() => ({}) as { code?: unknown })
    return typeof body.code === 'string' ? body.code : ''
  }
  const body = await c.req.parseBody().catch(() => ({}) as Record<string, unknown>)
  const code = body['code']
  return typeof code === 'string' ? code : ''
}

/** Minimal, mobile-friendly and emoji-free code page (no external dependencies). */
const codePage = (hasError: boolean): string => `<!doctype html>
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
  .error { margin: 0 0 1rem; color: #b3261e; font-size: .9rem }
</style>
</head>
<body>
<main>
  <h1>Visdomsatlasen</h1>
  <p>Den här förhandsversionen är öppen för inbjudna testare.</p>
  ${hasError ? '<p class="error" role="alert">Fel kod. Försök igen.</p>' : ''}
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
 * Builds gate middleware for a given code. Handles the login POST, checks
 * the cookie, and otherwise serves the code page (for HTML navigation) or 401.
 */
export const createAccessGate = (accessCode: string): MiddlewareHandler => {
  const token = accessCookieValue(accessCode)
  return async (c, next) => {
    // Login: verify the code, set the cookie, back to the app.
    if (c.req.method === 'POST' && c.req.path === LOGIN_PATH) {
      const submitted = await readCode(c)
      if (verifyAccessCode(submitted, accessCode)) {
        setCookie(c, COOKIE, token, {
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
          path: '/',
          maxAge: ONE_MONTH,
        })
        return c.redirect('/', 303)
      }
      return c.html(codePage(true), 401)
    }

    // robots.txt always passes through (it says Disallow: / anyway).
    if (c.req.path === '/robots.txt') return next()

    // Already inside?
    if (verifyAccessCookie(getCookie(c, COOKIE) ?? null, accessCode)) return next()

    // Deny: HTML navigation gets the code page, everything else (e.g. /api) gets 401.
    const wantsHtml = (c.req.header('Accept') ?? '').includes('text/html')
    if (c.req.method === 'GET' && wantsHtml) return c.html(codePage(false), 200)
    return c.text('Unauthorized', 401)
  }
}

/**
 * Mounts the gate on the app only when a code is present. Without a code the app is left open
 * (dev + Tailscale-only, backward-compatible). Collects the conditional mounting in
 * one place so the branch can be tested.
 */
export const mountAccessGate = (app: Hono, accessCode: string | undefined): void => {
  if (accessCode) app.use('*', createAccessGate(accessCode))
}
