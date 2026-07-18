import { describe, expect, it } from 'vitest'
import type { Room, Theme } from '../content/editorial/schema'
import { valbaraRum, valjRum } from './rumsval'

// Fabricerade poster: bara fälten urvalet läser behöver vara meningsfulla.
const rum = (id: string, themes: string[], status: Room['status'] = 'publicerad'): Room => ({
  id,
  slug: id,
  title: id,
  summary: 'x',
  primaryQuestion: 'fraga-x',
  themes,
  thoughtToCarry: 'x',
  reflectionQuestions: ['x?'],
  sources: [{ source: 'kalla-x', use: 'bearbetning', primary: true }],
  readingTimeMinutes: 4,
  language: 'sv',
  status,
  created: '2026-07-09',
  updated: '2026-07-09',
  opening: 'x',
  core: 'x',
})

const tema = (id: string, defaultRoom?: string): Theme => ({
  id,
  slug: id,
  label: id,
  defaultRoom,
  status: 'publicerad',
})

describe('valbaraRum', () => {
  it('släpper bara igenom publicerade rum med temat', () => {
    const alla = [
      rum('a', ['lugn']),
      rum('b', ['lugn'], 'utkast'),
      rum('c', ['lugn'], 'granskning'),
      rum('d', ['lugn'], 'arkiverad'),
      rum('e', ['mod']),
    ]
    expect(valbaraRum('lugn', alla).map((r) => r.id)).toEqual(['a'])
  })
})

describe('valjRum', () => {
  it('ger null när temat saknar publicerade rum', () => {
    expect(valjRum(tema('lugn'), [rum('a', ['lugn'], 'utkast')], [])).toBeNull()
  })

  it('väljer standardrummet vid första besöket', () => {
    const alla = [rum('a', ['lugn']), rum('b', ['lugn'])]
    expect(valjRum(tema('lugn', 'b'), alla, [])?.id).toBe('b')
  })

  it('undviker nyligen läst standardrum när alternativ finns', () => {
    const alla = [rum('a', ['lugn']), rum('b', ['lugn'])]
    expect(valjRum(tema('lugn', 'b'), alla, ['b'])?.id).toBe('a')
  })

  it('tillåter upprepning när allt är nyligen läst', () => {
    const alla = [rum('a', ['lugn'])]
    expect(valjRum(tema('lugn', 'a'), alla, ['a'])?.id).toBe('a')
  })

  it('föredrar aldrig lästa alternativ före längst-sedan-lästa', () => {
    const alla = [rum('a', ['lugn']), rum('b', ['lugn']), rum('c', ['lugn'])]
    // a är standard men nyss läst; b lästes tidigare; c har aldrig lästs.
    expect(valjRum(tema('lugn', 'a'), alla, ['a', 'b'])?.id).toBe('c')
  })

  it('glömmer historik bortom de tre senaste', () => {
    const alla = [rum('a', ['lugn']), rum('b', ['lugn'])]
    // a lästes för länge sedan (fjärde platsen) — får väljas som standard igen.
    expect(valjRum(tema('lugn', 'a'), alla, ['x1', 'x2', 'x3', 'a'])?.id).toBe('a')
  })

  it('väljer deterministiskt bland lika kandidater i innehållsordning', () => {
    const alla = [rum('a', ['lugn']), rum('b', ['lugn'])]
    // Inget standardrum, ingen historik: första i innehållsordningen vinner.
    expect(valjRum(tema('lugn'), alla, [])?.id).toBe('a')
  })
})
