import { Component, type ReactNode } from 'react'
import { report } from '../lib/telemetry'
import styles from './ErrorBoundary.module.css'

type Props = { children: ReactNode }
type State = { error: boolean }

/** Error boundary around the code-split pages (phase 13/14): catches when a page chunk
 * can't be loaded (e.g. offline before caching) or when a page throws during
 * render. Reports a page-load error and shows a calm, understandable empty state
 * instead of a white screen. Only the error message is logged — never the page's
 * content or the user's text. The boundary is keyed per route in RootLayout so
 * it resets on navigation. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: false }

  static getDerivedStateFromError(): State {
    return { error: true }
  }

  override componentDidCatch(error: Error): void {
    report({ type: 'page-load-error', resource: 'sida', detail: error.message })
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children
    return (
      <div className={styles.error} role="alert">
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
