import { Component, type ReactNode } from 'react'
import { rapportera } from '../lib/telemetri'
import styles from './Felgrans.module.css'

type Props = { children: ReactNode }
type State = { fel: boolean }

/** Felgräns kring de kod-delade sidorna (fas 13/14): fångar när en sidchunk inte
 * går att ladda (t.ex. offline innan cachning) eller när en sida kastar under
 * render. Rapporterar ett sidladdningsfel och visar ett lugnt, begripligt tomläge
 * i stället för en vit skärm. Bara felets meddelande loggas — aldrig sidans
 * innehåll eller användarens text. Boundaryn nycklas per route i RootLayout så
 * den nollställs vid navigation. */
export class Felgrans extends Component<Props, State> {
  override state: State = { fel: false }

  static getDerivedStateFromError(): State {
    return { fel: true }
  }

  override componentDidCatch(error: Error): void {
    rapportera({ typ: 'sidladdningsfel', resurs: 'sida', detalj: error.message })
  }

  override render(): ReactNode {
    if (!this.state.fel) return this.props.children
    return (
      <div className={styles.fel} role="alert">
        <p className={styles.text}>Sidan gick inte att visa just nu.</p>
        <button
          type="button"
          className={styles.knapp}
          onClick={() => window.location.reload()}
        >
          Försök igen
        </button>
      </div>
    )
  }
}
