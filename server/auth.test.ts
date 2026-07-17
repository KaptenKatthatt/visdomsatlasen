import { describe, expect, it } from 'vitest'
import { accessCookieValue, verifyAccessCode, verifyAccessCookie } from './auth'

const KOD = 'hemlig-testarkod-1234567890'

describe('verifyAccessCode', () => {
  it('accepterar rätt kod', () => {
    expect(verifyAccessCode(KOD, KOD)).toBe(true)
  })

  it('avvisar fel kod', () => {
    expect(verifyAccessCode('fel', KOD)).toBe(false)
  })

  it('avvisar tom inskickad kod', () => {
    expect(verifyAccessCode('', KOD)).toBe(false)
  })

  it('avvisar när ingen kod är konfigurerad', () => {
    expect(verifyAccessCode(KOD, '')).toBe(false)
  })
})

describe('accessCookieValue / verifyAccessCookie', () => {
  it('cookien lagrar aldrig plaintext-koden', () => {
    const value = accessCookieValue(KOD)
    expect(value).not.toContain(KOD)
    expect(value).toMatch(/^[0-9a-f]{64}$/)
  })

  it('verifierar cookien mot den härledda token', () => {
    expect(verifyAccessCookie(accessCookieValue(KOD), KOD)).toBe(true)
  })

  it('avvisar en cookie som inte matchar koden', () => {
    expect(verifyAccessCookie(accessCookieValue('annan'), KOD)).toBe(false)
  })

  it('avvisar tom cookie och osatt kod', () => {
    expect(verifyAccessCookie(null, KOD)).toBe(false)
    expect(verifyAccessCookie(accessCookieValue(KOD), '')).toBe(false)
  })
})
