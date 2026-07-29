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

// Ett block fortsätter föregående mening när det börjar med gemen eller
// parentes, eller när föregående block saknar slutskiljetecken.
const continuesSentence = (prev: string, next: string): boolean =>
  /^[a-zà-öø-ÿ(]/.test(next) || !/[.!?:;"”’)]$/.test(prev)

/**
 * Fogar ihop stycken som styckedelningen slet isär. Utgivarnas indragna
 * förklaringar ligger mitt inne i löpande stycken (Giles i Zhuangzi); när de
 * filtrerats bort står bitarna kvar som egna block, och ett stycke blir »The
 * Emperor Yao« / »wished to abdicate in favour of Hsü Yu,« / »saying, …«. Var
 * bit skulle sedan översättas för sig, som vore den en egen mening.
 *
 * Signalen är skiljetecken och versal, inte var förklaringen låg: av de par som
 * skiljs åt av en indragen förklaring är de flesta äkta styckebrytningar.
 */
export const joinBrokenParagraphs = (blocks: string[]): string[] => {
  const out: string[] = []
  for (const block of blocks) {
    const prev = out[out.length - 1]
    if (prev !== undefined && continuesSentence(prev, block)) out[out.length - 1] = `${prev} ${block}`
    else out.push(block)
  }
  return out
}
