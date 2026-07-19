import { afterEach, describe, expect, it, vi } from 'vitest'
import { anonymizeQuestion, report, withoutQuestion, type TechnicalEvent } from './telemetry'

describe('telemetri', () => {
  afterEach(() => vi.restoreAllMocks())

  it('anonymiserar en sökfråga till bara längd och ordantal', () => {
    // Never the text itself (analytics.md, sensitive search data is minimised).
    expect(anonymizeQuestion('vad är meningen')).toEqual({ length: 15, wordCount: 3 })
    expect(anonymizeQuestion('   ')).toEqual({ length: 0, wordCount: 0 })
    expect(anonymizeQuestion('lugn')).toEqual({ length: 4, wordCount: 1 })
  })

  it('strippar frågesträngen ur en resurs-URL så q= aldrig loggas', () => {
    expect(withoutQuestion('/api/library/search?q=ångest')).toBe('/api/library/search')
    expect(withoutQuestion('/api/library/works')).toBe('/api/library/works')
  })

  it('rapporterar bara händelsens egna, minimerade fält', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const event: TechnicalEvent = { type: 'search-no-hits', length: 4, wordCount: 1 }
    report(event)
    expect(spy).toHaveBeenCalledWith('[telemetry]', 'search-no-hits', event)
    // Nothing beyond the declared fields tags along.
    expect(Object.keys(event).sort()).toEqual(['length', 'type', 'wordCount'])
  })
})
