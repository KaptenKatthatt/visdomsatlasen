/** The reading settings' options and colours — shared by store and panel.
 * The colours are duplicated in global.css and in the pre-paint script in index.html
 * (which can't read CSS variables) — keep them in sync. */

/** Label + font stack per typeface, so the panel's buttons can be shown in their own font. */
export const FONT_OPTIONS = [
  { id: 'garamond', label: 'EB Garamond', stack: "'EB Garamond', Georgia, serif" },
  { id: 'literata', label: 'Literata', stack: "'Literata', Georgia, serif" },
  { id: 'sans', label: 'Source Sans', stack: "'Source Sans 3', system-ui, sans-serif" },
  {
    id: 'hyperlegible',
    label: 'Atkinson Hyperlegible',
    stack: "'Atkinson Hyperlegible', system-ui, sans-serif",
  },
] as const

export type FontChoice = (typeof FONT_OPTIONS)[number]['id']

/** The paper is the reading surface's colour — also the browser's theme-color in light mode. */
export const BG_OPTIONS = [
  { id: 'kram', label: 'Krämvit', paper: '#faf6ed' },
  { id: 'sepia', label: 'Sepia', paper: '#f7eed9' },
  { id: 'vit', label: 'Vit', paper: '#ffffff' },
] as const

export type BgChoice = (typeof BG_OPTIONS)[number]['id']

export const BG_PAPER = Object.fromEntries(
  BG_OPTIONS.map((option) => [option.id, option.paper]),
) as Record<BgChoice, string>

export const DARK_PAPER = '#1c1813'

export const MIN_TEXT_STEP = 1
export const MAX_TEXT_STEP = 5
