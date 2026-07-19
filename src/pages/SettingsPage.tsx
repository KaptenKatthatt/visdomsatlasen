import { DinaData } from '../components/DinaData'
import { BgPicker, DarkToggle, FontPicker, SizeStepper } from '../components/ReadingSettingsControls'
import { useAtlas } from '../lib/store'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import styles from './SettingsPage.module.css'

/** Settings (navigation.md: Settings) — appearance gathered on its own surface. */
export const SettingsPage = () => {
  useDocumentTitle('Inställningar')
  const { dark } = useAtlas()
  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <h1 className={styles.title}>Inställningar</h1>
      <p className={styles.lede}>Hur läsningen ska kännas.</p>
      <div className={styles.section}>
        <h2 className="kicker sectionKicker">Typsnitt</h2>
        <FontPicker />
      </div>
      <div className={styles.section}>
        <h2 className="kicker sectionKicker">Textstorlek</h2>
        <SizeStepper />
      </div>
      <div className={styles.section}>
        <h2 className="kicker sectionKicker">
          Bakgrund
          {dark && <span className={styles.hint}> · Gäller i ljust läge</span>}
        </h2>
        <BgPicker />
      </div>
      <div className={styles.section}>
        <h2 className="kicker sectionKicker">Tema</h2>
        <DarkToggle />
      </div>
      <div className={styles.section}>
        <h2 className="kicker sectionKicker">Dina data</h2>
        <p className={styles.dataLede}>
          Dina anteckningar och sparade platser stannar på den här enheten. Exportera dem i öppet
          format, importera tillbaka, eller rensa allt.
        </p>
        <DinaData />
      </div>
    </div>
  )
}
