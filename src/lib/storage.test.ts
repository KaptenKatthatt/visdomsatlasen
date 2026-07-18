// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readJson, writeJson } from './storage'

// Phase 13, testing localStorage limits: storage should behave predictably and
// calmly when it's full (quota exhausted) or unavailable (private mode) — the app
// keeps working, it never throws and never loses read values needlessly.
describe('storage', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('läser tillbaka det som skrivits', () => {
    writeJson('nyckel', { a: 1, b: ['x'] })
    expect(readJson('nyckel', null)).toEqual({ a: 1, b: ['x'] })
  })

  it('ger fallback när nyckeln saknas', () => {
    expect(readJson('saknas', 'standard')).toBe('standard')
  })

  it('ger fallback vid korrupt json', () => {
    window.localStorage.setItem('trasig', '{inte giltig json')
    expect(readJson('trasig', 42)).toBe(42)
  })

  it('sväljer skrivfel tyst när lagringen är full (QuotaExceededError)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('kvoten är slut', 'QuotaExceededError')
    })
    expect(() => writeJson('nyckel', { stor: 'x'.repeat(1024) })).not.toThrow()
  })

  it('ger fallback när läsning kastar (privat läge / åtkomst nekad)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('åtkomst nekad')
    })
    expect(readJson('nyckel', 'fallback')).toBe('fallback')
  })
})
