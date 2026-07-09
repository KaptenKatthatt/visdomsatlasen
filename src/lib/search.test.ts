import { describe, expect, it } from 'vitest'
import { searchAtlas } from './search'

describe('searchAtlas', () => {
  it('ger inga träffar för tom eller blank fråga', () => {
    expect(searchAtlas('')).toEqual([])
    expect(searchAtlas('   ')).toEqual([])
  })

  it('hittar ämnen på titel oavsett skiftläge', () => {
    const hits = searchAtlas('STOICISM')
    expect(hits.some((hit) => hit.to.kind === 'topic' && hit.to.id === 'stoicism')).toBe(true)
  })

  it('hittar personer på namn', () => {
    const hits = searchAtlas('epiktetos')
    expect(hits.some((hit) => hit.to.kind === 'person' && hit.to.id === 'epiktetos')).toBe(true)
  })

  it('ger varje träff en unik nyckel', () => {
    const hits = searchAtlas('e')
    const keys = hits.map((hit) => hit.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
