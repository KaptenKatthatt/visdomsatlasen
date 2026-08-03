import { describe, expect, it } from 'vitest'
import { isTranslatedEnough } from './coverage'

describe('isTranslatedEnough', () => {
  it('kräver minst 90 % översatta verser', () => {
    expect(isTranslatedEnough(9, 10)).toBe(true)
    expect(isTranslatedEnough(8, 10)).toBe(false)
    expect(isTranslatedEnough(0, 0)).toBe(false)
    expect(isTranslatedEnough(1, 1)).toBe(true)
  })
})
