import styles from './Bibliotek.module.css'

/** Shared loading/error line for the library views. */
export const StateNote = ({ loading, error }: { loading: boolean; error: string | null }) => {
  if (loading) return <p className={styles.stateNote}>Laddar …</p>
  return <p className={styles.stateNote}>{error ?? 'Kunde inte hämta texten.'}</p>
}
