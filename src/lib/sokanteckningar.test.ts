import { describe, expect, it } from 'vitest'
import type { Anteckning } from './personligt'
import { sokAnteckningar } from './sokanteckningar'

const anteckning = (id: string, text: string, updated: string): Anteckning => ({
  ursprungTyp: 'rum',
  ursprungId: id,
  text,
  created: '2026-07-01',
  updated,
})

const anteckningar: Record<string, Anteckning> = {
  a: anteckning('a', 'En tanke om förlåtelse och att släppa taget.', '2026-07-10'),
  b: anteckning('b', 'Om oron inför morgondagen.', '2026-07-12'),
  c: anteckning('c', '   ', '2026-07-13'),
}

describe('sokAnteckningar', () => {
  it('hittar anteckningar på normaliserad text (forlatelse hittar förlåtelse)', () => {
    expect(sokAnteckningar('forlatelse', anteckningar).map((a) => a.ursprungId)).toEqual(['a'])
  })

  it('ger inget för tom eller för kort fråga', () => {
    expect(sokAnteckningar('', anteckningar)).toEqual([])
    expect(sokAnteckningar('a', anteckningar)).toEqual([])
  })

  it('ger inget när frågan bara är stopord', () => {
    expect(sokAnteckningar('om och att', anteckningar)).toEqual([])
  })

  it('sorterar senast ändrad först', () => {
    const utökade = { ...anteckningar, d: anteckning('d', 'Mer om förlåtelse.', '2026-07-14') }
    expect(sokAnteckningar('förlåtelse', utökade).map((a) => a.ursprungId)).toEqual(['d', 'a'])
  })

  it('utelämnar tomma anteckningar', () => {
    expect(sokAnteckningar('tanke', anteckningar).some((a) => a.ursprungId === 'c')).toBe(false)
  })
})
