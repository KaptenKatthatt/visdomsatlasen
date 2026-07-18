// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { ShellContext } from '../lib/shell'
import { BottomSheet } from './BottomSheet'

afterEach(cleanup)

/** Efterliknar RootLayouts skal: main + nav som syskon till portalade ark. */
const Skal = ({ arkÖppet }: { arkÖppet: boolean }) => {
  const [skal, sättSkal] = useState<HTMLElement | null>(null)
  return (
    <div ref={sättSkal} data-testid="skal">
      <ShellContext.Provider value={skal}>
        <main>Bakgrundsinnehåll</main>
        <nav aria-label="Navigering">Flikar</nav>
        {arkÖppet && (
          <BottomSheet label="Anteckning" onClose={() => {}}>
            <p>Innehåll</p>
          </BottomSheet>
        )}
      </ShellContext.Provider>
    </div>
  )
}

describe('BottomSheet', () => {
  it('renderar en dialog med label, rubrik och innehåll', () => {
    render(
      <BottomSheet label="Anteckning" title="Om rummet" onClose={() => {}}>
        <p>Innehållet i arket</p>
      </BottomSheet>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Anteckning' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Om rummet')).toBeInTheDocument()
    expect(screen.getByText('Innehållet i arket')).toBeInTheDocument()
  })

  it('är modal och tar emot initialfokus', () => {
    render(
      <BottomSheet label="Anteckning" onClose={() => {}}>
        <p>Innehåll</p>
      </BottomSheet>,
    )
    const dialog = screen.getByRole('dialog', { name: 'Anteckning' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.activeElement).toBe(dialog)
  })

  it('stänger på Escape', async () => {
    const användare = userEvent.setup()
    const onClose = vi.fn()
    render(
      <BottomSheet label="Anteckning" onClose={onClose}>
        <p>Innehåll</p>
      </BottomSheet>,
    )
    await användare.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('anropar onClose via Klar-knappen och scrimmen', async () => {
    const användare = userEvent.setup()
    const onClose = vi.fn()
    render(
      <BottomSheet label="Anteckning" onClose={onClose}>
        <p>Innehåll</p>
      </BottomSheet>,
    )
    await användare.click(screen.getByRole('button', { name: 'Klar' }))
    await användare.click(screen.getByRole('button', { name: 'Stäng anteckning' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('portalas till skalet och gör main och nav inerta medan det är öppet', () => {
    const { rerender } = render(<Skal arkÖppet={true} />)
    const skal = screen.getByTestId('skal')
    const main = screen.getByRole('main', { hidden: true })
    const nav = skal.querySelector('nav')

    const överlägg = skal.querySelector(':scope > [data-overlay]')
    expect(överlägg).not.toBeNull()
    expect(main).toHaveAttribute('inert')
    expect(nav).toHaveAttribute('inert')
    expect(överlägg).not.toHaveAttribute('inert')

    rerender(<Skal arkÖppet={false} />)
    expect(main).not.toHaveAttribute('inert')
    expect(nav).not.toHaveAttribute('inert')
  })
})
