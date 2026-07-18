// Font loading (phase 13, optimise font loading): only the default font
// EB Garamond is registered in the startup bundle (main.tsx) — it's the default
// font for the reading surface and the interface. The three selectable fonts each
// carry a whole family's @font-face block; loading all four needlessly bloated the
// startup CSS. Here a selectable font's CSS is fetched only once the reader actually
// chooses it, once, and the browser caches the woff2 files (CacheFirst, see vite.config.ts).
import type { FontChoice } from './theme'

const loaders: Record<Exclude<FontChoice, 'garamond'>, () => Promise<unknown>> = {
  literata: () =>
    Promise.all([
      import('@fontsource/literata/400.css'),
      import('@fontsource/literata/500.css'),
      import('@fontsource/literata/600.css'),
      import('@fontsource/literata/400-italic.css'),
      import('@fontsource/literata/500-italic.css'),
    ]),
  sans: () =>
    Promise.all([
      import('@fontsource/source-sans-3/400.css'),
      import('@fontsource/source-sans-3/500.css'),
      import('@fontsource/source-sans-3/600.css'),
      import('@fontsource/source-sans-3/400-italic.css'),
    ]),
  hyperlegible: () =>
    Promise.all([
      import('@fontsource/atkinson-hyperlegible/400.css'),
      import('@fontsource/atkinson-hyperlegible/700.css'),
      import('@fontsource/atkinson-hyperlegible/400-italic.css'),
    ]),
}

const loaded = new Set<Exclude<FontChoice, 'garamond'>>()

/** Registers the chosen font's @font-face the first time it's selected.
 * Garamond is already in the startup bundle; the others are fetched once and cached.
 * A failed CSS import is reset so the choice can be retried — meanwhile
 * the text falls back on the font stack's Georgia/system-ui, never blank. */
export const loadFont = (val: FontChoice): void => {
  if (val === 'garamond' || loaded.has(val)) return
  loaded.add(val)
  void loaders[val]().catch(() => loaded.delete(val))
}
