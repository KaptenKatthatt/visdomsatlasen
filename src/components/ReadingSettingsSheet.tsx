import { useAtlas } from '../lib/store'
import { BottomSheet } from './BottomSheet'
import { BgPicker, DarkToggle, FontPicker, SizeStepper } from './ReadingSettingsControls'
import styles from './ReadingSettingsSheet.module.css'

/** Bottom-sheet med läsinställningar: typsnitt, textstorlek, bakgrund, tema. */
export const ReadingSettingsSheet = ({ onClose }: { onClose: () => void }) => {
  const { dark } = useAtlas()
  return (
    <BottomSheet label="Läsinställningar" onClose={onClose}>
      <h2 className={`kicker ${styles.sectionLabel}`}>Typsnitt</h2>
      <FontPicker />
      <h2 className={`kicker ${styles.sectionLabel}`}>Textstorlek</h2>
      <SizeStepper />
      <h2 className={`kicker ${styles.sectionLabel}`}>
        Bakgrund
        {dark && <span className={styles.hint}> · Gäller i ljust läge</span>}
      </h2>
      <BgPicker />
      <h2 className={`kicker ${styles.sectionLabel}`}>Tema</h2>
      <DarkToggle />
    </BottomSheet>
  )
}
