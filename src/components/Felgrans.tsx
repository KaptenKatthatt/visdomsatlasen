import { Component, type ReactNode } from 'react'
import { report } from '../lib/telemetry'
import styles from './Felgrans.module.css'

type Props = { children: ReactNode }
type State = { fel: boolean }

/** Error boundary around the code-split pages (phase 13/14): catches when a page chunk
 * can't be loaded (e.g. offline before caching) or when a page throws during
 * render. Reports a page-load error and shows a calm, understandable empty state
 * instead of a white screen. Only the error message is logged — never the page's
 * content or the user's text. The boundary is keyed per route in RootLayout so
 * it resets on navigation. */
export class Felgrans extends Component<Props, State> {
  override state: State = { fel: false }

  static getDerivedStateFromError(): State {
    return { fel: true }
  }

  override componentDidCatch(error: Error): void {
    report({ type: 'sidladdningsfel', resurs: 'sida', detalj: error.message })
  }

  override render(): ReactNode {
    if (!this.state.fel) return this.props.children
    return (
      <div className={styles.fel} role="alert">
        <p className={styles.text}>Sidan gick inte att visa just nu.</p>
        <button
          type="button"
          className={styles.button}
          onClick={() => window.location.reload()}
        >
          Försök igen
        </button>
      </div>
    )
  }
}
