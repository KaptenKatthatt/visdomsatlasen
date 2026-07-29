// Project Gutenbergs plaintext markerar kursiv med understreck: `_li_`. Giles
// kursiverar främmande ord och boktitlar i Zhuangzi, och markeringen följer med
// hela vägen genom ingesten ned i databasen. Här tolkas den vid läsningen i
// stället för att kastas — har författaren kursiverat ska vi också göra det.
//
// Robustheten bor här, inte i ingesten: verstexten är maskinöversatt, och en
// språkmodell som bär tecknen genom en översättning kan tappa eller flytta ett
// understreck. Därför blir bara balanserade par kursiv; ensamma understreck
// försvinner tyst i stället för att synas som skräptecken.

/** En bit verstext: `emphasis` betyder att den ska kursiveras. */
export type EmphasisPart = { text: string; emphasis: boolean }

// Ett par = `_X_` på samma rad, där X är icke-tomt och saknar understreck.
const PAIR = /_([^_\n]+)_/g

// Understreck som blev över när paren plockats ut hör inte till någon markering.
const stray = (text: string): string => text.replace(/_/g, '')

const push = (parts: EmphasisPart[], text: string, emphasis: boolean): void => {
  if (text.length > 0) parts.push({ text, emphasis })
}

/**
 * Delar verstexten i raka och kursiva bitar. Renderas som `<em>` i läsaren —
 * ingen markdown-parser och ingen inbäddad HTML, bara textbitar.
 */
export const emphasisParts = (text: string): EmphasisPart[] => {
  const parts: EmphasisPart[] = []
  let last = 0
  for (const match of text.matchAll(PAIR)) {
    push(parts, stray(text.slice(last, match.index)), false)
    push(parts, match[1] ?? '', true)
    last = match.index + match[0].length
  }
  push(parts, stray(text.slice(last)), false)
  return parts
}

/**
 * Samma regler, platt sträng. För ytor där kursiven inte går att lita på —
 * sökträffarnas snippets klipps med `…` och kan skära mitt i ett par.
 */
export const withoutEmphasis = (text: string): string =>
  emphasisParts(text)
    .map((part) => part.text)
    .join('')
