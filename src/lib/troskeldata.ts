// Tröskelns lätta datalager (fas 13, prestanda): hemskärmen behöver bara
// temana — inte rummens brödtext, sources eller sökindexet. Den globben bor här,
// helt utan rumsberoenden, så HemPage kan importera `troskelTeman` utan att dra
// in hela innehållssamlingen i startbunten. Rummen laddas först när ett tema
// väljs (dynamisk import i HemPage) eller när läsrummet/biblioteket öppnas.
import { temaSchema, type Theme } from '../content/editorial/schema'
import { samla, tillFiler } from '../content/editorial/samla'
import { tolkaPostfil } from '../content/editorial/tolka'

export const allaTeman: Theme[] = samla(
  tillFiler(import.meta.glob<string>('../content/themes/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(temaSchema, fil),
)

/** Tröskelns themes (home-and-entry.md): redaktionell order, aldrig arkiverade. */
export const troskelTeman: Theme[] = allaTeman
  .filter((tema) => tema.status !== 'arkiverad')
  .sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
      a.label.localeCompare(b.label, 'sv'),
  )
