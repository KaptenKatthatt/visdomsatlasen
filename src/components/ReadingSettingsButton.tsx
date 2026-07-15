import { useState } from 'react'
import { TypeIcon } from './Icons'
import { ReadingSettingsSheet } from './ReadingSettingsSheet'

/** "Aa"-knapp för läsvyernas topbar — öppnar panelen med läsinställningar.
 * BottomSheet portalas numera själv till skalelementet, så topbarens
 * backdrop-filter kan inte göra den till containing block för arket. */
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
