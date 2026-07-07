// Normaliserar Gutenberg-plaintext (CRLF → LF) och klipper bort PG-boilerplaten
// mellan `*** START OF …` och `*** END OF …`. Delas av plaintext-adaptrarna.
export const gutenbergBody = (raw: string): string => {
  const text = raw.replace(/\r/g, '')
  const startLine = /^\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG[^\n]*$/m.exec(text)
  const endLine = /^\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG[^\n]*$/m.exec(text)
  const from = startLine ? text.indexOf('\n', startLine.index) + 1 : 0
  const to = endLine ? endLine.index : text.length
  return text.slice(from, to)
}
