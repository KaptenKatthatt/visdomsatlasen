// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { useSidtitel } from './useSidtitel'

afterEach(cleanup)

const Sida = ({ titel }: { titel: string }) => {
  useSidtitel(titel)
  return <p>Sidan</p>
}

describe('useSidtitel', () => {
  it('sätter dokumenttiteln med grundtiteln som svans', () => {
    render(<Sida titel="Biblioteket" />)
    expect(document.title).toBe('Biblioteket · Visdomsatlasen')
  })

  it('faller tillbaka till grundtiteln vid tom titel', () => {
    render(<Sida titel="" />)
    expect(document.title).toBe('Visdomsatlasen')
  })

  it('följer med när titeln ändras och återställs vid unmount', () => {
    const { rerender, unmount } = render(<Sida titel="Sparat" />)
    rerender(<Sida titel="Inställningar" />)
    expect(document.title).toBe('Inställningar · Visdomsatlasen')
    unmount()
    expect(document.title).toBe('Visdomsatlasen')
  })
})
