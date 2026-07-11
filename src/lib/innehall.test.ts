import { describe, expect, it } from 'vitest'
import {
  allaRum,
  hittaKalla,
  hittaRum,
  hittaStandardRum,
  hittaTema,
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
})

describe('tröskeln', () => {
  it('ordnar temana redaktionellt och utan arkiverade', () => {
    expect(troskelTeman.map((tema) => tema.etikett)).toEqual([
      'Lugn',
      'Mening',
      'Mod',
      'Sanning',
      'Lidande',
      'Människan',
    ])
    expect(troskelTeman.every((tema) => tema.status !== 'arkiverad')).toBe(true)
  })

  it('hittar standardrummet för teman som har ett', () => {
    const lugn = troskelTeman.find((tema) => tema.slug === 'lugn')
    expect(lugn && hittaStandardRum(lugn)?.slug).toBe('det-du-inte-kan-styra')
    const mening = troskelTeman.find((tema) => tema.slug === 'mening')
    expect(mening && hittaStandardRum(mening)).toBeUndefined()
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
