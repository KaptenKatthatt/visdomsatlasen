import { describe, expect, it } from 'vitest'
import {
  allaRum,
  hittaFragaViaSlug,
  hittaKalla,
  hittaKallaViaSlug,
  hittaRum,
  hittaTema,
  hittaTradition,
  kallnamn,
  stycken,
  troskelTeman,
} from './innehall'

describe('innehållsladdaren', () => {
  it('laddar exempelrummet från markdown', () => {
    expect(allaRum.length).toBeGreaterThan(0)
    const rum = hittaRum('det-du-inte-kan-styra')
    expect(rum?.title).toBe('Det du inte kan styra')
    expect(rum?.opening.length).toBeGreaterThan(0)
    expect(rum?.core.length).toBeGreaterThan(0)
  })

  it('hittar rummets tema och source via relationerna', () => {
    const rum = hittaRum('det-du-inte-kan-styra')
    const tema = rum ? hittaTema(rum.themes[0] ?? '') : undefined
    expect(tema?.label).toBe('Lugn')
    const source = rum ? hittaKalla(rum.sources[0]?.source ?? '') : undefined
    expect(source && kallnamn(source)).toBe('Epiktetos')
  })

  it('laddar frågor, sources och traditions för biblioteket', () => {
    expect(hittaFragaViaSlug('vad-kan-du-styra')?.text).toBe('Vad kan du egentligen styra?')
    expect(hittaKallaViaSlug('enchiridion')?.title).toBe('Enchiridion (Handboken)')
    const traditionId = hittaKallaViaSlug('enchiridion')?.traditions?.[0] ?? ''
    expect(hittaTradition(traditionId)?.name).toBe('Stoicism')
  })
})

describe('tröskeln', () => {
  it('ordnar temana redaktionellt och utan arkiverade', () => {
    expect(troskelTeman.map((tema) => tema.label)).toEqual([
      'Lugn',
      'Mening',
      'Mod',
      'Sanning',
      'Lidande',
      'Människan',
    ])
    expect(troskelTeman.every((tema) => tema.status !== 'arkiverad')).toBe(true)
  })
})

describe('stycken', () => {
  it('delar på tomrad och slår ihop radbrytningar inom stycken', () => {
    expect(stycken('Första stycket\nfortsätter här.\n\nAndra stycket.')).toEqual([
      'Första stycket fortsätter här.',
      'Andra stycket.',
    ])
  })

  it('ger tom lista för tom text', () => {
    expect(stycken('  \n \n ')).toEqual([])
  })
})
