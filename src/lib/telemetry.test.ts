import { afterEach, describe, expect, it, vi } from 'vitest'
import { anonymizeQuestion, report, withoutQuestion, type TechnicalEvent } from './telemetry'

describe('telemetri', () => {
  afterEach(() => vi.restoreAllMocks())

  it('anonymiserar en sökfråga till bara längd och ordantal', () => {
    // Never the text itself (analytics.md, sensitive search data is minimised).
    expect(anonymizeQuestion('vad är meningen')).toEqual({ langd: 15, ord: 3 })
    expect(anonymizeQuestion('   ')).toEqual({ langd: 0, ord: 0 })
    expect(anonymizeQuestion('lugn')).toEqual({ langd: 4, ord: 1 })
  })

  it('strippar frågesträngen ur en resurs-URL så q= aldrig loggas', () => {
    expect(withoutQuestion('/api/library/search?q=ångest')).toBe('/api/library/search')
    expect(withoutQuestion('/api/library/works')).toBe('/api/library/works')
  })

  it('rapporterar bara händelsens egna, minimerade fält', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const händelse: TechnicalEvent = { type: 'sok-nolltraff', langd: 4, ord: 1 }
    report(händelse)
    expect(spy).toHaveBeenCalledWith('[telemetri]', 'sok-nolltraff', händelse)
    // Nothing beyond the declared fields tags along.
    expect(Object.keys(händelse).sort()).toEqual(['langd', 'ord', 'type'])
  })
})
