/** Läsinställningarnas valmöjligheter och färger — delas av store och panel.
 * Färgerna dupliceras i global.css och i pre-paint-skriptet i index.html
 * (som inte kan läsa CSS-variabler) — håll dem i synk. */

export type FontChoice = 'garamond' | 'literata' | 'sans' | 'hyperlegible'
export type BgChoice = 'kram' | 'sepia' | 'vit'

export const FONT_CHOICES: readonly FontChoice[] = [
  'garamond',
  'literata',
  'sans',
  'hyperlegible',
]

export const BG_CHOICES: readonly BgChoice[] = ['kram', 'sepia', 'vit']

/** Etikett + fontstack per typsnitt, så panelens knappar kan visas i sin egen font. */
export const FONT_OPTIONS: readonly {
  id: FontChoice
  label: string
  stack: string
}[] = [
  { id: 'garamond', label: 'EB Garamond', stack: "'EB Garamond', Georgia, serif" },
  { id: 'literata', label: 'Literata', stack: "'Literata', Georgia, serif" },
  { id: 'sans', label: 'Source Sans', stack: "'Source Sans 3', system-ui, sans-serif" },
  {
    id: 'hyperlegible',
    label: 'Atkinson Hyperlegible',
    stack: "'Atkinson Hyperlegible', system-ui, sans-serif",
  },
]

/** Papperets (läsytans) färg per bakgrundsval — även webbläsarens theme-color i ljust läge. */
export const BG_PAPER: Record<BgChoice, string> = {
  kram: '#faf6ed',
  sepia: '#f7eed9',
  vit: '#ffffff',
}

export const BG_LABELS: Record<BgChoice, string> = {
  kram: 'Krämvit',
  sepia: 'Sepia',
  vit: 'Vit',
}

export const DARK_PAPER = '#1c1813'

export const MIN_TEXT_STEP = 1
export const MAX_TEXT_STEP = 5
