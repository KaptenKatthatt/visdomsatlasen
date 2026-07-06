import { useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { BackIcon } from './Icons'

/** Sticky translucent top bar with a back button and optional right actions. */
export const TopBar = ({ right }: { right?: ReactNode }) => {
  const router = useRouter()
  return (
    <div className="topbar">
      <button
        type="button"
        onClick={() => router.history.back()}
        aria-label="Tillbaka"
        className="iconBtn"
        style={{ padding: '6px 6px 6px 0' }}
      >
        <BackIcon />
      </button>
      {right}
    </div>
  )
}
