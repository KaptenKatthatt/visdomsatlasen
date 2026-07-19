// @vitest-environment jsdom
import { StrictMode, useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useDialogKeyboard } from './useDialogKeyboard'

afterEach(cleanup)

const Ark = ({ onClose }: { onClose: () => void }) => {
  const arkRef = useRef<HTMLDivElement>(null)
  useDialogKeyboard(arkRef, onClose)
  return (
    <div ref={arkRef} role="dialog" aria-label="Testark" tabIndex={-1}>
      <button type="button">Första</button>
      <button type="button">Sista</button>
    </div>
  )
}

const WithTrigger = () => {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Öppna
      </button>
      {open && <Ark onClose={() => setOpen(false)} />}
    </div>
  )
}

describe('useDialogKeyboard', () => {
  it('flyttar initialfokus till arket', () => {
    render(<Ark onClose={() => {}} />)
    expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Testark' }))
  })

  it('stänger på Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Ark onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('cyklar Tab-fokus inom arket', async () => {
    const user = userEvent.setup()
    render(<Ark onClose={() => {}} />)
    const first = screen.getByRole('button', { name: 'Första' })
    const sista = screen.getByRole('button', { name: 'Sista' })

    await user.tab()
    expect(document.activeElement).toBe(first)
    await user.tab()
    expect(document.activeElement).toBe(sista)
    await user.tab()
    expect(document.activeElement).toBe(first)
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(sista)
  })

  it('återlämnar fokus till utlösaren när arket stängs', async () => {
    const user = userEvent.setup()
    render(<WithTrigger />)
    const trigger = screen.getByRole('button', { name: 'Öppna' })

    await user.click(trigger)
    expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Testark' }))

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('återlämnar fokus även under StrictMode-remontering', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <WithTrigger />
      </StrictMode>,
    )
    const trigger = screen.getByRole('button', { name: 'Öppna' })

    await user.click(trigger)
    expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Testark' }))

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
})
