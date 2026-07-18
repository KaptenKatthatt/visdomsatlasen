// Phase 14 (docs/specs/analytics.md): the app collects ONLY the technical minimum
// needed to keep quality up — never engagement. The sink is deliberately
// simple: the client's technical errors are logged calmly to the browser console, the server's
// to the server log. No third party, no endpoint, no DSN (owner's decision
// 2026-07-18). Private notes never touch this; search queries are only logged
// anonymised (length and word count, never the text).

/** The only events the app may report (analytics.md, Allowed Measurements).
 * Nothing here measures session, return, saving, notes or path completion
 * — and nothing feeds back into room selection. */
export type TechnicalEvent =
  | { type: 'sidladdningsfel'; resurs: string; detalj?: string }
  | { type: 'offline-laddningsfel'; resurs: string }
  | { type: 'ogiltig-innehallsrelation'; slag: string; från: string; reference: string }
  | { type: 'bruten-kallalank'; från: string; till: string }
  | { type: 'sokfel'; detalj: string }
  | { type: 'sok-nolltraff'; langd: number; ord: number }
  | { type: 'okaught-fel'; meddelande: string; source?: string }

/** Reports a technical event. The sink is the console — a simple, auditable
 * trace without a third party. `console.warn` so it shows in the log but never brings
 * the app down. Only the event's own, already minimised fields are logged: no personal
 * text, no raw search query, never note content. */
export const report = (handelse: TechnicalEvent): void => {
  console.warn('[telemetri]', handelse.type, handelse)
}

/** Anonymises a search query into harmless measures (analytics.md, Sensitive Query
 * Data): only length and word count, never the text itself. */
export const anonymizeQuestion = (question: string): { langd: number; ord: number } => {
  const trimmad = question.trim()
  return { langd: trimmad.length, ord: trimmad === '' ? 0 : trimmad.split(/\s+/).length }
}

/** Strips a query string out of a resource URL before it's logged, so a search query's
 * text never leaks in via an error call (e.g. /api/library/search?q=…). */
export const withoutQuestion = (url: string): string => url.split('?')[0] ?? url

let installerad = false

/** Catches global, otherwise invisible errors (analytics.md): uncaught errors and rejected
 * promises. Registered once at app start. Logs only the error's message and
 * place — never the page's content or the user's text. */
export const installeraGlobalaFelfangare = (): void => {
  if (installerad || typeof window === 'undefined') return
  installerad = true
  window.addEventListener('error', (event) => {
    // Only real script errors: skip empty/resource events without a message,
    // so the log carries meaningful entries instead of noise. event.error is `any`
    // in the DOM types; narrow to unknown before use.
    const fel = (event as { error?: unknown }).error
    if (!event.message && !fel) return
    report({
      type: 'okaught-fel',
      meddelande: event.message || 'Okänt fel',
      ...(event.filename ? { source: `${event.filename}:${event.lineno}` } : {}),
    })
  })
  window.addEventListener('unhandledrejection', (event) => {
    // event.reason is `any` in the DOM types; narrow to unknown before use.
    const cause = (event as { reason?: unknown }).reason
    report({ type: 'okaught-fel', meddelande: cause instanceof Error ? cause.message : String(cause) })
  })
}
