import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { accessCookieValue } from './auth'
import { createAccessGate, mountAccessGate } from './gate'

const CODE = 'hemlig-testarkod-1234567890'

/** Builds a small app with the gate mounted and a protected dummy route. */
const byggApp = (): Hono => {
  const app = new Hono()
  app.use('*', createAccessGate(CODE))
  app.get('/api/library/works', (c) => c.json({ works: [] }))
  app.get('/', (c) => c.html('<!doctype html><title>app</title>'))
  return app
}

const cookie = `va_access=${accessCookieValue(CODE)}`

describe('createAccessGate', () => {
  it('serverar kod-sidan för HTML-navigering utan cookie', async () => {
    const res = await byggApp().request('/', { headers: { Accept: 'text/html' } })
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Åtkomstkod')
  })

  it('nekar API-anrop utan cookie med 401', async () => {
    const res = await byggApp().request('/api/library/works')
    expect(res.status).toBe(401)
  })

  it('POST /api/access med rätt kod sätter cookie och omdirigerar', async () => {
    const res = await byggApp().request('/api/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: CODE }),
    })
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('/')
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('va_access=')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).not.toContain(CODE)
  })

  it('POST /api/access med fel kod ger 401 och kod-sidan', async () => {
    const res = await byggApp().request('/api/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: 'fel' }),
    })
    expect(res.status).toBe(401)
    expect(await res.text()).toContain('Fel kod')
  })

  it('släpper igenom med giltig cookie', async () => {
    const res = await byggApp().request('/api/library/works', { headers: { Cookie: cookie } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ works: [] })
  })

  it('sätter Secure på cookien bara när anropet kom över HTTPS', async () => {
    const inloggning = async (headers: Record<string, string>): Promise<Response> =>
      byggApp().request('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
        body: new URLSearchParams({ code: CODE }),
      })
    // Funnel/the proxy sets X-Forwarded-Proto: https.
    const viaHttps = await inloggning({ 'X-Forwarded-Proto': 'https' })
    expect(viaHttps.headers.get('set-cookie') ?? '').toContain('Secure')
    // Direct tailnet IP over plain HTTP: no Secure, or the cookie is never stored.
    const viaHttp = await inloggning({})
    expect(viaHttp.headers.get('set-cookie') ?? '').not.toContain('Secure')
  })

  it('släpper förbi POST /api/ingest (eget token-skydd) men inte GET', async () => {
    const app = byggApp()
    app.post('/api/ingest', (c) => c.json({ results: [] }))
    const post = await app.request('/api/ingest', { method: 'POST' })
    expect(post.status).toBe(200)
    const get = await app.request('/api/ingest')
    expect(get.status).toBe(401)
  })

  it('släpper alltid igenom robots.txt', async () => {
    const app = byggApp()
    app.get('/robots.txt', (c) => c.text('User-agent: *\nDisallow: /'))
    const res = await app.request('/robots.txt')
    expect(res.status).toBe(200)
  })

  // Mirrors server/index.ts: the gate is mounted BEFORE routes are registered, otherwise
  // the Hono middleware doesn't cover them.
  it('mountAccessGate lämnar appen öppen utan kod (bakåtkompatibelt)', async () => {
    const app = new Hono()
    mountAccessGate(app, undefined)
    app.get('/api/library/works', (c) => c.json({ works: [] }))
    const res = await app.request('/api/library/works')
    expect(res.status).toBe(200)
  })

  it('mountAccessGate spärrar när en kod finns', async () => {
    const app = new Hono()
    mountAccessGate(app, CODE)
    app.get('/api/library/works', (c) => c.json({ works: [] }))
    const res = await app.request('/api/library/works')
    expect(res.status).toBe(401)
  })
})
