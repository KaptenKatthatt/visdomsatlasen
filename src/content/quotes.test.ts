import { describe, expect, it } from 'vitest'
import { quoteOfTheDay } from './quotes'

describe('quoteOfTheDay', () => {
  it('ger samma citat hela dagen', () => {
    const morgon = quoteOfTheDay(new Date('2026-07-09T06:00:00Z'))
    const kvall = quoteOfTheDay(new Date('2026-07-09T21:00:00Z'))
    expect(morgon).toEqual(kvall)
  })

  it('byter citat mellan dagar inom en cykel', () => {
    const dagar = [0, 1, 2, 3].map((offset) =>
      quoteOfTheDay(new Date(Date.UTC(2026, 6, 6 + offset))),
    )
    const unika = new Set(dagar.map((quote) => quote.t))
    expect(unika.size).toBeGreaterThan(1)
  })

  it('ger alltid ett citat med text och avsändare', () => {
    const quote = quoteOfTheDay(new Date('2026-07-09'))
    expect(quote.t.length).toBeGreaterThan(0)
    expect(quote.by.length).toBeGreaterThan(0)
  })
})
