import { describe, expect, it } from 'vitest'
import {
  allRooms,
  findQuestionBySlug,
  findSource,
  findSourceBySlug,
  findRoom,
  findTheme,
  findTradition,
  sourceName,
  paragraphs,
  thresholdThemes,
} from './content'

describe('innehållsladdaren', () => {
  it('laddar exempelrummet från markdown', () => {
    expect(allRooms.length).toBeGreaterThan(0)
    const room = findRoom('det-du-inte-kan-styra')
    expect(room?.title).toBe('Det du inte kan styra')
    expect(room?.opening.length).toBeGreaterThan(0)
    expect(room?.core.length).toBeGreaterThan(0)
  })

  it('hittar rummets tema och källa via relationerna', () => {
    const room = findRoom('det-du-inte-kan-styra')
    const theme = room ? findTheme(room.themes[0] ?? '') : undefined
    expect(theme?.label).toBe('Lugn')
    const source = room ? findSource(room.sources[0]?.source ?? '') : undefined
    expect(source && sourceName(source)).toBe('Epiktetos')
  })

  it('laddar frågor, källor och traditioner för biblioteket', () => {
    expect(findQuestionBySlug('vad-kan-du-styra')?.text).toBe('Vad kan du egentligen styra?')
    expect(findSourceBySlug('enchiridion')?.title).toBe('Enchiridion (Handboken)')
    const traditionId = findSourceBySlug('enchiridion')?.traditions?.[0] ?? ''
    expect(findTradition(traditionId)?.name).toBe('Stoicism')
  })
})

describe('tröskeln', () => {
  it('ordnar temana redaktionellt och visar bara publicerade', () => {
    expect(thresholdThemes.map((theme) => theme.label)).toEqual([
      'Lugn',
      'Mening',
      'Mod',
      'Sanning',
      'Lidande',
      'Människan',
      'Tro',
    ])
    expect(thresholdThemes.every((theme) => theme.status === 'published')).toBe(true)
  })
})

describe('stycken', () => {
  it('delar på tomrad och slår ihop radbrytningar inom stycken', () => {
    expect(paragraphs('Första stycket\nfortsätter här.\n\nAndra stycket.')).toEqual([
      'Första stycket fortsätter här.',
      'Andra stycket.',
    ])
  })

  it('ger tom lista för tom text', () => {
    expect(paragraphs('  \n \n ')).toEqual([])
  })
})
