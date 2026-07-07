import { useAtlas } from '../lib/store'
import {
  BG_CHOICES,
  BG_LABELS,
  BG_PAPER,
  FONT_OPTIONS,
  MAX_TEXT_STEP,
  MIN_TEXT_STEP,
} from '../lib/theme'
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
          <span key={i} className={i < textStep ? styles.dotOn : styles.dotOff} />
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
      {BG_CHOICES.map((choice) => (
        <button
          key={choice}
          type="button"
          role="radio"
          aria-checked={bg === choice}
          className={styles.swatchBtn}
          onClick={() => setBg(choice)}
          disabled={dark}
        >
          <span className={styles.swatch} style={{ background: BG_PAPER[choice] }} />
          {BG_LABELS[choice]}
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
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.scrim}
        onClick={onClose}
        aria-label="Stäng läsinställningar"
      />
      <div className={styles.holder}>
        <div className={styles.sheet} role="dialog" aria-label="Läsinställningar">
          <div className={styles.head}>
            <div className="kicker">Läsinställningar</div>
            <button type="button" className={styles.done} onClick={onClose}>
              Klar
            </button>
          </div>
          <div className={styles.sectionLabel}>Typsnitt</div>
          <FontPicker />
          <div className={styles.sectionLabel}>Textstorlek</div>
          <SizeStepper />
          <div className={styles.sectionLabel}>
            Bakgrund
            {dark && <span className={styles.hint}> · Gäller i ljust läge</span>}
          </div>
          <BgPicker />
          <div className={styles.sectionLabel}>Tema</div>
          <DarkToggle />
        </div>
      </div>
    </div>
  )
}
