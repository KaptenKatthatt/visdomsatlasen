// Tröskelns lätta datalager (fas 13, prestanda): hemskärmen behöver bara
// temana — inte rummens brödtext, källor eller sökindexet. Den globben bor här,
// helt utan rumsberoenden, så HemPage kan importera `troskelTeman` utan att dra
// in hela innehållssamlingen i startbunten. Rummen laddas först när ett tema
// väljs (dynamisk import i HemPage) eller när läsrummet/biblioteket öppnas.
import { temaSchema, type Tema } from '../content/redaktion/schema'
import { samla, tillFiler } from '../content/redaktion/samla'
import { tolkaPostfil } from '../content/redaktion/tolka'

export const allaTeman: Tema[] = samla(
  tillFiler(import.meta.glob<string>('../content/teman/*.md', { query: '?raw', import: 'default', eager: true })),
  (fil) => tolkaPostfil(temaSchema, fil),
)

/** Tröskelns teman (home-and-entry.md): redaktionell ordning, aldrig arkiverade. */
export const troskelTeman: Tema[] = allaTeman
  .filter((tema) => tema.status !== 'arkiverad')
  .sort(
    (a, b) =>
      (a.ordning ?? Number.MAX_SAFE_INTEGER) - (b.ordning ?? Number.MAX_SAFE_INTEGER) ||
      a.etikett.localeCompare(b.etikett, 'sv'),
  )
