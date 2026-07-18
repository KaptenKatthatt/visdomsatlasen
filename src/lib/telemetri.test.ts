import { afterEach, describe, expect, it, vi } from 'vitest'
import { anonymiseraFraga, rapportera, utanFraga, type TechnicalEvent } from './telemetri'

describe('telemetri', () => {
  afterEach(() => vi.restoreAllMocks())

  it('anonymiserar en sökfråga till bara längd och ordantal', () => {
    // Aldrig själva texten (analytics.md, känslig sökdata minimeras).
    expect(anonymiseraFraga('vad är meningen')).toEqual({ langd: 15, ord: 3 })
    expect(anonymiseraFraga('   ')).toEqual({ langd: 0, ord: 0 })
    expect(anonymiseraFraga('lugn')).toEqual({ langd: 4, ord: 1 })
  })

  it('strippar frågesträngen ur en resurs-URL så q= aldrig loggas', () => {
    expect(utanFraga('/api/library/search?q=ångest')).toBe('/api/library/search')
    expect(utanFraga('/api/library/works')).toBe('/api/library/works')
  })

  it('rapporterar bara händelsens egna, minimerade fält', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const händelse: TechnicalEvent = { type: 'sok-nolltraff', langd: 4, ord: 1 }
    rapportera(händelse)
    expect(spy).toHaveBeenCalledWith('[telemetri]', 'sok-nolltraff', händelse)
    // Ingenting utöver de deklarerade fälten följer med.
    expect(Object.keys(händelse).sort()).toEqual(['langd', 'ord', 'type'])
  })
})
