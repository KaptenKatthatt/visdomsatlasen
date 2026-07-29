import { describe, expect, it } from 'vitest'
import { emphasisParts, snippetParts } from './verseText'

describe('emphasisParts', () => {
  it('plockar ut ett par som kursiv bit', () => {
    expect(emphasisParts('många tusen _li_ i storlek')).toEqual([
      { text: 'många tusen ', emphasis: false },
      { text: 'li', emphasis: true },
      { text: ' i storlek', emphasis: false },
    ])
  })

  it('klarar flera par på samma rad', () => {
    expect(emphasisParts('_Yin_ och _Yang_')).toEqual([
      { text: 'Yin', emphasis: true },
      { text: ' och ', emphasis: false },
      { text: 'Yang', emphasis: true },
    ])
  })

  it('kursiverar flerordiga titlar', () => {
    expect(emphasisParts('Och i _Underverkens krönika_ läser vi')).toEqual([
      { text: 'Och i ', emphasis: false },
      { text: 'Underverkens krönika', emphasis: true },
      { text: ' läser vi', emphasis: false },
    ])
  })

  it('lämnar text utan markering orörd', () => {
    expect(emphasisParts('Mitt liv har en gräns.')).toEqual([
      { text: 'Mitt liv har en gräns.', emphasis: false },
    ])
  })

  it('släpper ensamma understreck i stället för att visa dem', () => {
    expect(emphasisParts('många tusen _li i storlek')).toEqual([
      { text: 'många tusen li i storlek', emphasis: false },
    ])
  })

  it('behandlar tomt par som ensamma understreck', () => {
    expect(emphasisParts('före __ efter')).toEqual([{ text: 'före  efter', emphasis: false }])
  })

  it('ger tom lista för tom text', () => {
    expect(emphasisParts('')).toEqual([])
  })
})

describe('snippetParts', () => {
  it('delar på serverns träffmarkörer', () => {
    expect(snippetParts('en fisk, kallad ⟦Leviathan⟧, många tusen')).toEqual([
      { text: 'en fisk, kallad ', hit: false },
      { text: 'Leviathan', hit: true },
      { text: ', många tusen', hit: false },
    ])
  })

  it('tar bort kursivmarkeringen men behåller orden', () => {
    expect(snippetParts('många tusen _li_ i storlek')).toEqual([
      { text: 'många tusen li i storlek', hit: false },
    ])
  })

  it('städar bort ett avhugget pars ensamma understreck', () => {
    expect(snippetParts('… tusen _li_ bred. Med en _mäktig')).toEqual([
      { text: '… tusen li bred. Med en mäktig', hit: false },
    ])
  })
})
