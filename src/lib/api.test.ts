import { describe, expect, it } from 'vitest'
import { bookId, slugOfBook } from './api'

describe('bookId', () => {
  it('bygger bok-id av verk och slug', () => {
    expect(bookId('bibel-1917', 'matteus')).toBe('bibel-1917/matteus')
  })
})

describe('slugOfBook', () => {
  it('plockar ut sluggen ur ett fullständigt bok-id', () => {
    expect(slugOfBook('bibel-1917', 'bibel-1917/matteus')).toBe('matteus')
  })

  it('är invers till bookId', () => {
    expect(slugOfBook('dhammapada', bookId('dhammapada', 'dhammapada'))).toBe('dhammapada')
  })

  it('lämnar id:t orört när prefixet inte matchar verket', () => {
    expect(slugOfBook('bibel-1917', 'annat-verk/matteus')).toBe('annat-verk/matteus')
  })
})
