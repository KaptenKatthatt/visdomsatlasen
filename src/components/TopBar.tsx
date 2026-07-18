import { useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { BackIcon } from './Icons'

/**
 * Sticky translucent top bar with a back button and optional right actions.
 * Pass `onBack` to go up one level in the hierarchy; without it, this goes back one
 * step in history.
 */
export const TopBar = ({
  right,
  onBack,
}: {
  right?: ReactNode
  onBack?: () => void
}) => {
  const router = useRouter()
  const handleBack = onBack ?? (() => router.history.back())
  return (
    <header className="topbar">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Tillbaka"
        className="iconBtn"
        style={{ padding: '6px 6px 6px 0' }}
      >
        <BackIcon />
      </button>
      {right}
    </header>
  )
}
