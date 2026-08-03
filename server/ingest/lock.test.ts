import { describe, expect, it } from 'vitest'
import { isWorkLocked, parseForceRetranslate } from './lock'

describe('parseForceRetranslate', () => {
  it('tolkar tom env som tom mängd', () => {
    expect(parseForceRetranslate(undefined)).toEqual(new Set())
    expect(parseForceRetranslate('')).toEqual(new Set())
  })

  it('tolkar komma-separerad allowlist', () => {
    expect(parseForceRetranslate('forsvarstalet, zhuangzi')).toEqual(
      new Set(['forsvarstalet', 'zhuangzi']),
    )
  })
})

describe('isWorkLocked', () => {
  const status = new Map<string, boolean>([
    ['forsvarstalet', true],
    ['dhammapada', false],
    ['bibel-1917', false],
  ])

  it('låser redan översatta verk', () => {
    expect(isWorkLocked('forsvarstalet', status, new Set())).toBe(true)
  })

  it('låser Bibeln när den finns i DB även om translated=0', () => {
    expect(isWorkLocked('bibel-1917', status, new Set())).toBe(true)
  })

  it('låser inte oöversatta verk', () => {
    expect(isWorkLocked('dhammapada', status, new Set())).toBe(false)
  })

  it('låser inte verk som saknas i DB', () => {
    expect(isWorkLocked('analekterna', status, new Set())).toBe(false)
  })

  it('låser upp med FORCE_RETRANSLATE-allowlist', () => {
    expect(isWorkLocked('forsvarstalet', status, new Set(['forsvarstalet']))).toBe(false)
    expect(isWorkLocked('bibel-1917', status, new Set(['bibel-1917']))).toBe(false)
  })
})
