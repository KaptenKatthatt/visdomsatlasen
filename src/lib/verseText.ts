// Typography of the source texts where they are read — the verkläsare's verses
// and its search snippets. Project Gutenberg's plaintext marks italics with
// underscores (`_li_`), and Giles italicises foreign words and book titles all
// through Zhuangzi. The marking travels untouched through ingest down into the
// database and is interpreted here, at reading time: har författaren kursiverat
// ska vi också göra det.
//
// The robustness lives on this side rather than in ingest, because the verse text
// is machine-translated and a model that carries the characters through a
// translation can drop or move one. Only balanced pairs become italics; a lone
// underscore disappears quietly instead of showing up as a stray character.

/** A run of verse text: `emphasis` means it should be italicised. */
export type EmphasisPart = { text: string; emphasis: boolean }

/** A run of a search snippet: `hit` means it matched the query. */
export type SnippetPart = { text: string; hit: boolean }

// A pair is `_X_` on one line, where X is non-empty and free of underscores.
const PAIR = /_([^_\n]+)_/g

// Underscores left over once the pairs are taken out belong to no marking.
const dropStrayUnderscores = (text: string): string => text.replace(/_/g, '')

const push = (parts: EmphasisPart[], text: string, emphasis: boolean): void => {
  if (text.length > 0) parts.push({ text, emphasis })
}

/**
 * Splits verse text into upright and italic runs, rendered as `<em>` in the
 * reader — no markdown parser and no embedded HTML, just runs of text.
 */
export const emphasisParts = (text: string): EmphasisPart[] => {
  const parts: EmphasisPart[] = []
  let last = 0
  for (const match of text.matchAll(PAIR)) {
    push(parts, dropStrayUnderscores(text.slice(last, match.index)), false)
    push(parts, match[1] ?? '', true)
    last = match.index + match[0].length
  }
  push(parts, dropStrayUnderscores(text.slice(last)), false)
  return parts
}

// The server wraps a snippet's matched words in ⟦…⟧ (server/library/search.ts).
const HIT_MARKERS = /⟦|⟧/

/**
 * Splits a search snippet into plain and matched runs. The italic marking is
 * dropped rather than interpreted: the `…` clipping can cut straight through a
 * pair, and on a flat string the pair rules amount to dropping every underscore.
 */
export const snippetParts = (snippet: string): SnippetPart[] =>
  dropStrayUnderscores(snippet)
    .split(HIT_MARKERS)
    .map((text, i) => ({ text, hit: i % 2 === 1 }))
