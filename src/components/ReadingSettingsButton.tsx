import { useState } from 'react'
import { createPortal } from 'react-dom'
import { TypeIcon } from './Icons'
import { ReadingSettingsSheet } from './ReadingSettingsSheet'

/** "Aa"-knapp för läsvyernas topbar — öppnar panelen med läsinställningar.
 * Arket portalas till .shell: topbarens backdrop-filter gör den annars till
 * containing block för fixed-element, så arket skulle fästas i topbaren. */
export const ReadingSettingsButton = () => {
  const [open, setOpen] = useState(false)
  const shell = open ? document.querySelector('.shell') : null
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
      {shell && createPortal(<ReadingSettingsSheet onClose={() => setOpen(false)} />, shell)}
    </>
  )
}
