import { describe, expect, it } from 'vitest'
import type { Room, Theme } from '../content/editorial/schema'
import { valbaraRoom, selectRoom } from './roomSelection'

// Fabricerade poster: bara fälten urvalet läser behöver vara meningsfulla.
const room = (id: string, themes: string[], status: Room['status'] = 'published'): Room => ({
  id,
  slug: id,
  title: id,
  summary: 'x',
  primaryQuestion: 'fraga-x',
  themes,
  thoughtToCarry: 'x',
  reflectionQuestions: ['x?'],
  sources: [{ source: 'kalla-x', use: 'adaptation', primary: true }],
  readingTimeMinutes: 4,
  language: 'sv',
  status,
  created: '2026-07-09',
  updated: '2026-07-09',
  opening: 'x',
  core: 'x',
})

const theme = (id: string, defaultRoom?: string): Theme => ({
  id,
  slug: id,
  label: id,
  defaultRoom,
  status: 'published',
})

describe('valbaraRum', () => {
  it('släpper bara igenom publicerade rum med temat', () => {
    const all = [
      room('a', ['lugn']),
      room('b', ['lugn'], 'draft'),
      room('c', ['lugn'], 'review'),
      room('d', ['lugn'], 'archived'),
      room('e', ['mod']),
    ]
    expect(valbaraRoom('lugn', all).map((r) => r.id)).toEqual(['a'])
  })
})

describe('valjRum', () => {
  it('ger null när temat saknar publicerade rum', () => {
    expect(selectRoom(theme('lugn'), [room('a', ['lugn'], 'draft')], [])).toBeNull()
  })

  it('väljer standardrummet vid första besöket', () => {
    const all = [room('a', ['lugn']), room('b', ['lugn'])]
    expect(selectRoom(theme('lugn', 'b'), all, [])?.id).toBe('b')
  })

  it('undviker nyligen läst standardrum när alternativ finns', () => {
    const all = [room('a', ['lugn']), room('b', ['lugn'])]
    expect(selectRoom(theme('lugn', 'b'), all, ['b'])?.id).toBe('a')
  })

  it('tillåter upprepning när allt är nyligen läst', () => {
    const all = [room('a', ['lugn'])]
    expect(selectRoom(theme('lugn', 'a'), all, ['a'])?.id).toBe('a')
  })

  it('föredrar aldrig lästa alternativ före längst-sedan-lästa', () => {
    const all = [room('a', ['lugn']), room('b', ['lugn']), room('c', ['lugn'])]
    // a är standard men nyss läst; b lästes tidigare; c har aldrig lästs.
    expect(selectRoom(theme('lugn', 'a'), all, ['a', 'b'])?.id).toBe('c')
  })

  it('glömmer historik bortom de tre senaste', () => {
    const all = [room('a', ['lugn']), room('b', ['lugn'])]
    // a lästes för länge sedan (fjärde platsen) — får väljas som standard igen.
    expect(selectRoom(theme('lugn', 'a'), all, ['x1', 'x2', 'x3', 'a'])?.id).toBe('a')
  })

  it('väljer deterministiskt bland lika kandidater i innehållsordning', () => {
    const all = [room('a', ['lugn']), room('b', ['lugn'])]
    // Inget standardrum, ingen historik: första i innehållsordningen vinner.
    expect(selectRoom(theme('lugn'), all, [])?.id).toBe('a')
  })
})
