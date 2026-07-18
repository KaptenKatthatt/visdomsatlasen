import styles from './Sidladdning.module.css'

/** Stilla väntetillstånd medan en kod-delad sida hämtas (fas 13). Sidchunkarna
 * är små och oftast precachade, så detta syns sällan och bara ett ögonblick.
 * Dämpade prickar i appens egen paus-estetik — ingen spinner, inget hopp. */
export const Sidladdning = () => (
  <div className={styles.laddning} role="status">
    <span className="dots" aria-hidden>
      ···
    </span>
    <span className="srOnly">Laddar</span>
  </div>
)
