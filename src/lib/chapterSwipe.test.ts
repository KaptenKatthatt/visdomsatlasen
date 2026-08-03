import { describe, expect, it } from 'vitest'
import { chapterSwipeTarget } from './chapterSwipe'

describe('chapterSwipeTarget', () => {
  it('swipe vänster ger next', () => {
    expect(chapterSwipeTarget({ dx: -60, dy: 0, prev: 2, next: 4 })).toBe(4)
  })

  it('swipe höger ger prev', () => {
    expect(chapterSwipeTarget({ dx: 60, dy: 0, prev: 2, next: 4 })).toBe(2)
  })

  it('för kort gest ger null', () => {
    expect(chapterSwipeTarget({ dx: -40, dy: 0, prev: 2, next: 4 })).toBeNull()
  })

  it('vertikal dominans ger null', () => {
    expect(chapterSwipeTarget({ dx: -60, dy: 80, prev: 2, next: 4 })).toBeNull()
  })

  it('saknad next ger null vid swipe vänster', () => {
    expect(chapterSwipeTarget({ dx: -60, dy: 0, prev: 2, next: null })).toBeNull()
  })

  it('saknad prev ger null vid swipe höger', () => {
    expect(chapterSwipeTarget({ dx: 60, dy: 0, prev: null, next: 4 })).toBeNull()
  })
})
