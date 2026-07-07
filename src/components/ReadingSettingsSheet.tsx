import { useAtlas } from '../lib/store'
import { BG_OPTIONS, FONT_OPTIONS, MAX_TEXT_STEP, MIN_TEXT_STEP } from '../lib/theme'
import { BottomSheet } from './BottomSheet'
import { MoonIcon } from './Icons'
import styles from './ReadingSettingsSheet.module.css'

const FontPicker = () => {
  const { font, setFont } = useAtlas()
  return (
    <div className={styles.options} role="radiogroup" aria-label="Typsnitt">
      {FONT_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={font === option.id}
          className={styles.option}
          style={{ fontFamily: option.stack }}
          onClick={() => setFont(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

const SizeStepper = () => {
  const { textStep, stepText } = useAtlas()
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.stepBtn}
        onClick={() => stepText(-1)}
        disabled={textStep <= MIN_TEXT_STEP}
        aria-label="Mindre text"
      >
        A
      </button>
      <span className={styles.stepDots} aria-live="polite" aria-label={`Textstorlek ${textStep} av ${MAX_TEXT_STEP}`}>
        {Array.from({ length: MAX_TEXT_STEP }, (_, i) => (
          <span key={i} className={i < textStep ? `${styles.dot} ${styles.dotOn}` : styles.dot} />
        ))}
      </span>
      <button
        type="button"
        className={`${styles.stepBtn} ${styles.stepBtnLarge}`}
        onClick={() => stepText(1)}
        disabled={textStep >= MAX_TEXT_STEP}
        aria-label="Större text"
      >
        A
      </button>
    </div>
  )
}

const BgPicker = () => {
  const { bg, dark, setBg } = useAtlas()
  return (
    <div className={styles.options} role="radiogroup" aria-label="Bakgrund">
      {BG_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={bg === option.id}
          className={styles.swatchBtn}
          onClick={() => setBg(option.id)}
          disabled={dark}
        >
          <span className={styles.swatch} style={{ background: option.paper }} />
          {option.label}
        </button>
      ))}
    </div>
  )
}

const DarkToggle = () => {
  const { dark, toggleDark } = useAtlas()
  return (
    <button
      type="button"
      className={styles.darkRow}
      onClick={toggleDark}
      aria-pressed={dark}
    >
      <span className={styles.darkLabel}>
        <MoonIcon />
        Mörkt läge
      </span>
      <span className={styles.darkState}>{dark ? 'På' : 'Av'}</span>
    </button>
  )
}

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
