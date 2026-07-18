// Tröskelns lätta datalager (fas 13, prestanda): hemskärmen behöver bara
// temana — inte rummens brödtext, sources eller sökindexet. Den globben bor här,
// helt utan rumsberoenden, så HemPage kan importera `troskelTeman` utan att dra
// in hela innehållssamlingen i startbunten. Rummen laddas först när ett tema
// väljs (dynamisk import i HemPage) eller när läsrummet/biblioteket öppnas.
import { themeSchema, type Theme } from '../content/editorial/schema'
import { collect, toFiles } from '../content/editorial/collect'
import { parsePostFile } from '../content/editorial/parse'

export const allThemes: Theme[] = collect(
  toFiles(import.meta.glob<string>('../content/themes/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => parsePostFile(themeSchema, fil),
)

/** Tröskelns themes (home-and-entry.md): redaktionell order, bara publicerade —
 * utkast får aldrig synas för läsare. */
export const thresholdThemes: Theme[] = allThemes
  .filter((theme) => theme.status === 'published')
  .sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
      a.label.localeCompare(b.label, 'sv'),
  )
