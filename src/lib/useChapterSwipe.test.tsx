// @vitest-environment jsdom
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { useChapterSwipe } from './useChapterSwipe'

afterEach(cleanup)

const Host = ({
  onNavigate,
  prev,
  next,
}: {
  onNavigate: (chapter: number) => void
  prev: number | null
  next: number | null
}) => {
  const rootRef = useRef<HTMLDivElement>(null)
  useChapterSwipe(rootRef, { prev, next, onNavigate })
  return (
    <div ref={rootRef} data-testid="root">
      <p>Vers</p>
      <a href="#next">Nästa</a>
      <button type="button">Bokmärke</button>
    </div>
  )
}

const firePointer = (
  el: Element,
  type: 'pointerdown' | 'pointerup',
  x: number,
  y: number,
) => {
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: 'touch',
    }),
  )
}

describe('useChapterSwipe', () => {
  it('navigerar till next vid swipe vänster', () => {
    const onNavigate = vi.fn()
    const { getByTestId } = render(<Host onNavigate={onNavigate} prev={2} next={4} />)
    const root = getByTestId('root')
    firePointer(root, 'pointerdown', 200, 100)
    firePointer(root, 'pointerup', 120, 105)
    expect(onNavigate).toHaveBeenCalledWith(4)
  })

  it('navigerar till prev vid swipe höger', () => {
    const onNavigate = vi.fn()
    const { getByTestId } = render(<Host onNavigate={onNavigate} prev={2} next={4} />)
    const root = getByTestId('root')
    firePointer(root, 'pointerdown', 120, 100)
    firePointer(root, 'pointerup', 200, 105)
    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it('ignorerar vertikal scroll-gest', () => {
    const onNavigate = vi.fn()
    const { getByTestId } = render(<Host onNavigate={onNavigate} prev={2} next={4} />)
    const root = getByTestId('root')
    firePointer(root, 'pointerdown', 200, 100)
    firePointer(root, 'pointerup', 190, 200)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('ignorerar gest som startar på länk', () => {
    const onNavigate = vi.fn()
    const { getByText } = render(<Host onNavigate={onNavigate} prev={2} next={4} />)
    const link = getByText('Nästa')
    firePointer(link, 'pointerdown', 200, 100)
    firePointer(link, 'pointerup', 120, 105)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('ignorerar gest som startar på knapp', () => {
    const onNavigate = vi.fn()
    const { getByRole } = render(<Host onNavigate={onNavigate} prev={2} next={4} />)
    const button = getByRole('button', { name: 'Bokmärke' })
    firePointer(button, 'pointerdown', 200, 100)
    firePointer(button, 'pointerup', 120, 105)
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
