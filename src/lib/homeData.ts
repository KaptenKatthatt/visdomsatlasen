// The threshold's lightweight data layer (phase 13, performance): the home screen
// only needs the themes — not the rooms' body text, sources or the search index.
// That glob lives here, entirely without room dependencies, so HomePage can import
// `troskelTeman` without pulling the whole content collection into the startup
// bundle. The rooms load only when a theme is chosen (dynamic import in HomePage)
// or when the reading room/library is opened.
import { themeSchema, type Theme } from '../content/editorial/schema'
import { collect, toFiles } from '../content/editorial/collect'
import { parsePostFile } from '../content/editorial/parse'

export const allThemes: Theme[] = collect(
  toFiles(import.meta.glob<string>('../content/themes/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => parsePostFile(themeSchema, fil),
)

/** The threshold's themes (home-and-entry.md): editorial order, published only —
 * drafts must never be visible to readers. */
export const thresholdThemes: Theme[] = allThemes
  .filter((theme) => theme.status === 'published')
  .sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
      a.label.localeCompare(b.label, 'sv'),
  )
