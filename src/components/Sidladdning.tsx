import styles from './Sidladdning.module.css'

/** Quiet waiting state while a code-split page is fetched (phase 13). The page chunks
 * are small and usually precached, so this rarely shows and only for a moment.
 * Muted dots in the app's own pause aesthetic — no spinner, no jump. */
export const Sidladdning = () => (
  <div className={styles.laddning} role="status">
    <span className="dots" aria-hidden>
      ···
    </span>
    <span className="srOnly">Laddar</span>
  </div>
)
