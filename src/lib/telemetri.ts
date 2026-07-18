// Fas 14 (docs/specs/analytics.md): appen samlar BARA det tekniska minimum som
// krävs för att hålla kvaliteten uppe — aldrig engagemang. Sänkan är medvetet
// enkel: klientens tekniska fel loggas lugnt till webbläsarens konsol, serverns
// till serverloggen. Ingen tredjepart, ingen endpoint, ingen DSN (ägarens beslut
// 2026-07-18). Privata anteckningar rör detta aldrig; sökfrågor loggas bara
// anonymiserat (längd och ordantal, aldrig texten).

/** De enda händelser appen får rapportera (analytics.md, Allowed Measurements).
 * Inget här mäter session, återkomst, sparande, anteckningar eller vandringsavslut
 * — och inget matar tillbaka in i rumsvalet. */
export type TekniskHandelse =
  | { type: 'sidladdningsfel'; resurs: string; detalj?: string }
  | { type: 'offline-laddningsfel'; resurs: string }
  | { type: 'ogiltig-innehallsrelation'; slag: string; från: string; reference: string }
  | { type: 'bruten-kallalank'; från: string; till: string }
  | { type: 'sokfel'; detalj: string }
  | { type: 'sok-nolltraff'; langd: number; ord: number }
  | { type: 'okaught-fel'; meddelande: string; source?: string }

/** Rapporterar en teknisk händelse. Sänkan är konsolen — ett enkelt, granskbart
 * spår utan tredjepart. `console.warn` så det syns i loggen men aldrig fäller
 * appen. Bara händelsens egna, redan minimerade fält loggas: ingen personlig
 * text, ingen rå sökfråga, aldrig anteckningsinnehåll. */
export const rapportera = (handelse: TekniskHandelse): void => {
  console.warn('[telemetri]', handelse.type, handelse)
}

/** Anonymiserar en sökfråga till ofarliga mått (analytics.md, Sensitive Query
 * Data): bara längd och ordantal, aldrig själva texten. */
export const anonymiseraFraga = (fraga: string): { langd: number; ord: number } => {
  const trimmad = fraga.trim()
  return { langd: trimmad.length, ord: trimmad === '' ? 0 : trimmad.split(/\s+/).length }
}

/** Rensar bort en frågesträng ur en resurs-URL innan den loggas, så en sökfrågas
 * text aldrig läcker in via ett fel-anrop (t.ex. /api/library/search?q=…). */
export const utanFraga = (url: string): string => url.split('?')[0] ?? url

let installerad = false

/** Fångar globala, annars osynliga fel (analytics.md): okaught-fel och avvisade
 * promises. Registreras en gång vid appstart. Loggar bara felets meddelande och
 * place — aldrig sidans innehåll eller användarens text. */
export const installeraGlobalaFelfangare = (): void => {
  if (installerad || typeof window === 'undefined') return
  installerad = true
  window.addEventListener('error', (event) => {
    // Bara riktiga skriptfel: hoppa över tomma/resurshändelser utan meddelande,
    // så loggen bär meningsfulla poster i stället för brus. event.error är `any`
    // i DOM-typerna; smalna av till unknown innan use.
    const fel = (event as { error?: unknown }).error
    if (!event.message && !fel) return
    rapportera({
      type: 'okaught-fel',
      meddelande: event.message || 'Okänt fel',
      ...(event.filename ? { source: `${event.filename}:${event.lineno}` } : {}),
    })
  })
  window.addEventListener('unhandledrejection', (event) => {
    // event.reason är `any` i DOM-typerna; smalna av till unknown innan use.
    const orsak = (event as { reason?: unknown }).reason
    rapportera({ type: 'okaught-fel', meddelande: orsak instanceof Error ? orsak.message : String(orsak) })
  })
}
