import { describe, expect, it } from 'vitest'
import { inomEttSkrivfel, normalisera, ordlista, soktokens, stam } from './soknormalisering'

describe('normalisera', () => {
  it('trimmar, gör gemener och viker svenska diakriter', () => {
    expect(normalisera('  Förlåtelse ')).toBe('forlatelse')
    expect(normalisera('DÖDEN')).toBe('doden')
    expect(normalisera('Ängslan')).toBe('angslan')
  })

  it('lämnar redan normaliserad text oförändrad', () => {
    expect(normalisera('lugn')).toBe('lugn')
  })
})

describe('ordlista', () => {
  it('delar på skiljetecken och släpper tomma', () => {
    expect(ordlista('Vad gör oron med dagen?')).toEqual(['vad', 'gor', 'oron', 'med', 'dagen'])
  })
})

describe('soktokens', () => {
  it('filtrerar bort stopord', () => {
    expect(soktokens('Hur lever man med osäkerhet?')).toEqual(['lever', 'osakerhet'])
  })

  it('ger tom lista när frågan bara är stopord', () => {
    expect(soktokens('vad är det som')).toEqual([])
  })
})

describe('stam', () => {
  it('förenar singular och plural', () => {
    expect(stam('frågor')).toBe(stam('fråga'))
    expect(stam('gåvor')).toBe(stam('gåva'))
  })

  it('rör inte korta ord', () => {
    expect(stam('ro')).toBe('ro')
    expect(stam('liv')).toBe('liv')
  })
})

describe('inomEttSkrivfel', () => {
  it('tolererar ett utskott', () => {
    expect(inomEttSkrivfel('förlåtele', 'förlåtelse')).toBe(true)
    expect(inomEttSkrivfel(normalisera('förlåtele'), normalisera('förlåtelse'))).toBe(true)
  })

  it('tolererar ett teckenbyte och en omkastning', () => {
    expect(inomEttSkrivfel('stoicsm', 'stoicism')).toBe(true)
    expect(inomEttSkrivfel('meninng', 'menning')).toBe(true)
    expect(inomEttSkrivfel('samtla', 'samtal')).toBe(true)
  })

  it('avvisar korta ord där ett fel byter mening', () => {
    expect(inomEttSkrivfel('lugn', 'lung')).toBe(false)
    expect(inomEttSkrivfel('ro', 'ru')).toBe(false)
  })

  it('avvisar två eller fler fel', () => {
    expect(inomEttSkrivfel('stoism', 'stoicism')).toBe(false)
    expect(inomEttSkrivfel('förltse', 'förlåtelse')).toBe(false)
  })

  it('räknar inte lika ord som en felträff', () => {
    expect(inomEttSkrivfel('förlåtelse', 'förlåtelse')).toBe(false)
  })
})
