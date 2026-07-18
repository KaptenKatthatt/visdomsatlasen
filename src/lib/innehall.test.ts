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
    expect(rum?.titel).toBe('Det du inte kan styra')
    expect(rum?.öppning.length).toBeGreaterThan(0)
    expect(rum?.kärna.length).toBeGreaterThan(0)
  })

  it('hittar rummets tema och källa via relationerna', () => {
    const rum = hittaRum('det-du-inte-kan-styra')
    const tema = rum ? hittaTema(rum.teman[0] ?? '') : undefined
    expect(tema?.etikett).toBe('Lugn')
    const källa = rum ? hittaKalla(rum.källor[0]?.källa ?? '') : undefined
    expect(källa && kallnamn(källa)).toBe('Epiktetos')
  })

  it('laddar frågor, källor och traditioner för biblioteket', () => {
    expect(hittaFragaViaSlug('vad-kan-du-styra')?.text).toBe('Vad kan du egentligen styra?')
    expect(hittaKallaViaSlug('enchiridion')?.titel).toBe('Enchiridion (Handboken)')
    const traditionId = hittaKallaViaSlug('enchiridion')?.traditioner?.[0] ?? ''
    expect(hittaTradition(traditionId)?.namn).toBe('Stoicism')
  })
})

describe('tröskeln', () => {
  it('ordnar temana redaktionellt och visar bara publicerade', () => {
    expect(troskelTeman.map((tema) => tema.etikett)).toEqual([
      'Lugn',
      'Mening',
      'Mod',
      'Sanning',
      'Lidande',
      'Människan',
      'Jesus',
    ])
    expect(troskelTeman.every((tema) => tema.status === 'publicerad')).toBe(true)
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
