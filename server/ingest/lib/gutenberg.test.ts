import { describe, expect, it } from 'vitest'
import { joinBrokenParagraphs } from './gutenberg'

describe('joinBrokenParagraphs', () => {
  it('fogar ihop ett stycke som utgivarens förklaringar slitit isär', () => {
    expect(
      joinBrokenParagraphs([
        'The Emperor Yao',
        'wished to abdicate in favour of Hsü Yu,',
        'saying, "If, when the sun and moon are shining …"',
      ]),
    ).toEqual([
      'The Emperor Yao wished to abdicate in favour of Hsü Yu, saying, "If, when the sun and moon are shining …"',
    ])
  })

  it('låter två avslutade meningar förbli två stycken', () => {
    const blocks = ['My life has a limit.', 'But my knowledge is without limit.']
    expect(joinBrokenParagraphs(blocks)).toEqual(blocks)
  })

  it('börjar nytt stycke på citattecken efter avslutad mening', () => {
    const blocks = ['Such is the difference between small and great.', '"He declared," replied Chien Wu.']
    expect(joinBrokenParagraphs(blocks)).toEqual(blocks)
  })

  it('fångar fortsättningen även när den börjar med citat, om meningen hänger', () => {
    expect(
      joinBrokenParagraphs(['It was on this very subject that the Emperor T\'ang', '"spoke to Chi."']),
    ).toEqual(['It was on this very subject that the Emperor T\'ang "spoke to Chi."'])
  })

  it('behandlar gemen begynnelse som fortsättning', () => {
    expect(joinBrokenParagraphs(['He could ride upon the wind.', 'and travel whithersoever he wished.'])).toEqual([
      'He could ride upon the wind. and travel whithersoever he wished.',
    ])
  })

  it('lämnar en tom lista i fred', () => {
    expect(joinBrokenParagraphs([])).toEqual([])
  })
})
