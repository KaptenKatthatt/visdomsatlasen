// Typsnittsladdning (fas 13, optimise font loading): bara standardtypsnittet
// EB Garamond registreras i startbunten (main.tsx) — det är läsytans och
// gränssnittets förvalda font. De tre valbara typsnitten bär var för sig en hel
// familjs @font-face-block; att ladda alla fyra i onödan svällde start-CSS:en.
// Här hämtas ett valbart typsnitts CSS först när läsaren faktiskt väljer det,
// en gång, och webbläsaren cachar woff2-filerna (CacheFirst, se vite.config.ts).
import type { FontChoice } from './theme'

const laddare: Record<Exclude<FontChoice, 'garamond'>, () => Promise<unknown>> = {
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

const laddade = new Set<Exclude<FontChoice, 'garamond'>>()

/** Registrerar det valda typsnittets @font-face första gången det väljs.
 * Garamond ligger redan i startbunten; övriga hämtas en gång och cachas. Ett
 * misslyckat CSS-anrop nollställs så valet kan försökas igen — under tiden
 * faller texten tillbaka på fontstackens Georgia/system-ui, aldrig blankt. */
export const laddaFont = (val: FontChoice): void => {
  if (val === 'garamond' || laddade.has(val)) return
  laddade.add(val)
  void laddare[val]().catch(() => laddade.delete(val))
}
