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
const Skal = ({ sheetOpen }: { sheetOpen: boolean }) => {
  const [skal, setShell] = useState<HTMLElement | null>(null)
  return (
    <div ref={setShell} data-testid="skal">
      <ShellContext.Provider value={skal}>
        <main>Bakgrundsinnehåll</main>
        <nav aria-label="Navigering">Flikar</nav>
        {sheetOpen && (
          <BottomSheet label="Anteckning" onClose={() => {}}>
            <p>Innehåll</p>
          </BottomSheet>
        )}
      </ShellContext.Provider>
    </div>
  )
}

describe('BottomSheet', () => {
  it('renderar en dialog med etikett, rubrik och innehåll', () => {
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
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <BottomSheet label="Anteckning" onClose={onClose}>
        <p>Innehåll</p>
      </BottomSheet>,
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('anropar onClose via Klar-knappen och scrimmen', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <BottomSheet label="Anteckning" onClose={onClose}>
        <p>Innehåll</p>
      </BottomSheet>,
    )
    await user.click(screen.getByRole('button', { name: 'Klar' }))
    await user.click(screen.getByRole('button', { name: 'Stäng anteckning' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('döljer Klar-knappen när showDone är false', () => {
    render(
      <BottomSheet label="Meny" showDone={false} onClose={() => {}}>
        <p>Innehåll</p>
      </BottomSheet>,
    )
    expect(screen.queryByRole('button', { name: 'Klar' })).not.toBeInTheDocument()
  })

  it('portalas till skalet och gör main och nav inerta medan det är öppet', () => {
    const { rerender } = render(<Skal sheetOpen={true} />)
    const skal = screen.getByTestId('skal')
    const main = screen.getByRole('main', { hidden: true })
    const nav = skal.querySelector('nav')

    const overlay = skal.querySelector(':scope > [data-overlay]')
    expect(overlay).not.toBeNull()
    expect(main).toHaveAttribute('inert')
    expect(nav).toHaveAttribute('inert')
    expect(overlay).not.toHaveAttribute('inert')

    rerender(<Skal sheetOpen={false} />)
    expect(main).not.toHaveAttribute('inert')
    expect(nav).not.toHaveAttribute('inert')
  })
})
