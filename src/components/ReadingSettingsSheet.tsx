import { useAtlas } from '../lib/store'
import { BottomSheet } from './BottomSheet'
import { BgPicker, DarkToggle, FontPicker, SizeStepper } from './ReadingSettingsControls'
import styles from './ReadingSettingsSheet.module.css'

/** Bottom-sheet med läsinställningar: typsnitt, textstorlek, bakgrund, tema. */
export const ReadingSettingsSheet = ({ onClose }: { onClose: () => void }) => {
  const { dark } = useAtlas()
  return (
    <BottomSheet label="Läsinställningar" onClose={onClose}>
      <div className={`kicker ${styles.sectionLabel}`}>Typsnitt</div>
      <FontPicker />
      <div className={`kicker ${styles.sectionLabel}`}>Textstorlek</div>
      <SizeStepper />
      <div className={`kicker ${styles.sectionLabel}`}>
        Bakgrund
        {dark && <span className={styles.hint}> · Gäller i ljust läge</span>}
      </div>
      <BgPicker />
      <div className={`kicker ${styles.sectionLabel}`}>Tema</div>
      <DarkToggle />
    </BottomSheet>
  )
}
