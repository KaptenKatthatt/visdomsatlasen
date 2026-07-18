// Privat anteckningssök (search.md, Notes Search): en helt egen väg. Söker BARA
// den aktuella användarens anteckningar och delar ingenting med det publika
// indexet — den importerar aldrig sokindex/soklogik, så ingen anteckningstext
// kan påverka eller läcka in i publika resultat (Fas 9 Privacy/AI Access).
import type { Note } from './personal'
import { ordlista, soktokens } from './searchNormalize'

// Alla meningsbärande ord måste förekomma i anteckningen (AND), som exakt ord,
// prefix eller — för längre ord — delsträng. Samma svenska normalisering som
// publika söket, men utan synonymer/rankning: privat text ska hittas, inte vägas.
const matchar = (tokens: string[], text: string): boolean => {
  const ord = ordlista(text)
  return tokens.every((token) =>
    ord.some(
      (o) => o === token || o.startsWith(token) || (token.length >= 4 && o.includes(token)),
    ),
  )
}

/** Söker användarens anteckningar, senast ändrad först. Tomma anteckningar och
 * frågor kortare än två meningsbärande tecken ger inget. */
export const searchNotes = (
  question: string,
  anteckningar: Record<string, Note>,
): Note[] => {
  if (ordlista(question).join(' ').length < 2) return []
  const tokens = soktokens(question)
  if (tokens.length === 0) return []
  return Object.values(anteckningar)
    .filter((anteckning) => anteckning.text.trim().length > 0)
    .filter((anteckning) => matchar(tokens, anteckning.text))
    .sort((a, b) => b.updated.localeCompare(a.updated))
}
