import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useShell } from '../lib/shell'
import { TypeIcon } from './Icons'
import { ReadingSettingsSheet } from './ReadingSettingsSheet'

/** "Aa"-knapp för läsvyernas topbar — öppnar panelen med läsinställningar.
 * Arket portalas till skalelementet: topbarens backdrop-filter gör den annars
 * till containing block för fixed-element, så arket skulle fästas i topbaren. */
export const ReadingSettingsButton = () => {
  const [open, setOpen] = useState(false)
  const shell = useShell()
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Läsinställningar"
        aria-haspopup="dialog"
        className="iconBtn"
      >
        <TypeIcon />
      </button>
      {open &&
        shell &&
        createPortal(<ReadingSettingsSheet onClose={() => setOpen(false)} />, shell)}
    </>
  )
}
