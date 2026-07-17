import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { accessCookieValue } from './auth'
import { createAccessGate, mountAccessGate } from './gate'

const KOD = 'hemlig-testarkod-1234567890'

/** Bygger en liten app med spärren monterad och en skyddad dummy-route. */
const byggApp = (): Hono => {
  const app = new Hono()
  app.use('*', createAccessGate(KOD))
  app.get('/api/library/works', (c) => c.json({ works: [] }))
  app.get('/', (c) => c.html('<!doctype html><title>app</title>'))
  return app
}

const kaka = `va_access=${accessCookieValue(KOD)}`

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
      body: new URLSearchParams({ code: KOD }),
    })
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('/')
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('va_access=')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).not.toContain(KOD)
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
    const res = await byggApp().request('/api/library/works', { headers: { Cookie: kaka } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ works: [] })
  })

  it('släpper alltid igenom robots.txt', async () => {
    const app = byggApp()
    app.get('/robots.txt', (c) => c.text('User-agent: *\nDisallow: /'))
    const res = await app.request('/robots.txt')
    expect(res.status).toBe(200)
  })

  // Speglar server/index.ts: spärren monteras FÖRE routes registreras, annars
  // täcker Hono-middlewaren dem inte.
  it('mountAccessGate lämnar appen öppen utan kod (bakåtkompatibelt)', async () => {
    const app = new Hono()
    mountAccessGate(app, undefined)
    app.get('/api/library/works', (c) => c.json({ works: [] }))
    const res = await app.request('/api/library/works')
    expect(res.status).toBe(200)
  })

  it('mountAccessGate spärrar när en kod finns', async () => {
    const app = new Hono()
    mountAccessGate(app, KOD)
    app.get('/api/library/works', (c) => c.json({ works: [] }))
    const res = await app.request('/api/library/works')
    expect(res.status).toBe(401)
  })
})
