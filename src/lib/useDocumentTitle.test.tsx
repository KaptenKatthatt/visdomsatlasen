// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { useDocumentTitle } from './useDocumentTitle'

afterEach(cleanup)

const Sida = ({ title }: { title: string }) => {
  useDocumentTitle(title)
  return <p>Sidan</p>
}

describe('useDocumentTitle', () => {
  it('sätter dokumenttiteln med grundtiteln som svans', () => {
    render(<Sida title="Biblioteket" />)
    expect(document.title).toBe('Biblioteket · Visdomsatlasen')
  })

  it('faller tillbaka till grundtiteln vid tom title', () => {
    render(<Sida title="" />)
    expect(document.title).toBe('Visdomsatlasen')
  })

  it('följer med när titeln ändras och återställs vid unmount', () => {
    const { rerender, unmount } = render(<Sida title="Sparat" />)
    rerender(<Sida title="Inställningar" />)
    expect(document.title).toBe('Inställningar · Visdomsatlasen')
    unmount()
    expect(document.title).toBe('Visdomsatlasen')
  })
})
