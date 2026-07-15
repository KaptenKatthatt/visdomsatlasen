// @vitest-environment jsdom
import { StrictMode, useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useDialogTangentbord } from './useDialogTangentbord'

afterEach(cleanup)

const Ark = ({ onStäng }: { onStäng: () => void }) => {
  const arkRef = useRef<HTMLDivElement>(null)
  useDialogTangentbord(arkRef, onStäng)
  return (
    <div ref={arkRef} role="dialog" aria-label="Testark" tabIndex={-1}>
      <button type="button">Första</button>
      <button type="button">Sista</button>
    </div>
  )
}

const MedUtlösare = () => {
  const [öppet, sättÖppet] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => sättÖppet(true)}>
        Öppna
      </button>
      {öppet && <Ark onStäng={() => sättÖppet(false)} />}
    </div>
  )
}

describe('useDialogTangentbord', () => {
  it('flyttar initialfokus till arket', () => {
    render(<Ark onStäng={() => {}} />)
    expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Testark' }))
  })

  it('stänger på Escape', async () => {
    const användare = userEvent.setup()
    const onStäng = vi.fn()
    render(<Ark onStäng={onStäng} />)
    await användare.keyboard('{Escape}')
    expect(onStäng).toHaveBeenCalledTimes(1)
  })

  it('cyklar Tab-fokus inom arket', async () => {
    const användare = userEvent.setup()
    render(<Ark onStäng={() => {}} />)
    const första = screen.getByRole('button', { name: 'Första' })
    const sista = screen.getByRole('button', { name: 'Sista' })

    await användare.tab()
    expect(document.activeElement).toBe(första)
    await användare.tab()
    expect(document.activeElement).toBe(sista)
    await användare.tab()
    expect(document.activeElement).toBe(första)
    await användare.tab({ shift: true })
    expect(document.activeElement).toBe(sista)
  })

  it('återlämnar fokus till utlösaren när arket stängs', async () => {
    const användare = userEvent.setup()
    render(<MedUtlösare />)
    const utlösare = screen.getByRole('button', { name: 'Öppna' })

    await användare.click(utlösare)
    expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Testark' }))

    await användare.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(utlösare)
  })

  it('återlämnar fokus även under StrictMode-remontering', async () => {
    const användare = userEvent.setup()
    render(
      <StrictMode>
        <MedUtlösare />
      </StrictMode>,
    )
    const utlösare = screen.getByRole('button', { name: 'Öppna' })

    await användare.click(utlösare)
    expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Testark' }))

    await användare.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(utlösare)
  })
})
