import { useState } from 'react'
import { TypeIcon } from './Icons'
import { ReadingSettingsSheet } from './ReadingSettingsSheet'

/** "Aa" button for the reading views' top bar — opens the reading-settings panel.
 * BottomSheet now portals itself into the shell element, so the top bar's
 * backdrop-filter can't make it the containing block for the sheet. */
export const ReadingSettingsButton = () => {
  const [open, setOpen] = useState(false)
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
      {open && <ReadingSettingsSheet onClose={() => setOpen(false)} />}
    </>
  )
}
