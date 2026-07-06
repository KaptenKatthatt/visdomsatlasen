const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
}

// Avkoda en numerisk kodpunkt, men bara om den är giltig — annars släpps den
// (fromCodePoint kastar RangeError för värden > 0x10FFFF, vilket annars skulle
// stjälpa hela ingesten).
const codePoint = (n: number): string => (n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '')

const decodeEntities = (text: string): string =>
  text
    .replace(/&#(\d+);/g, (_, n: string) => codePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => codePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name: string) => NAMED[name] ?? m)

/**
 * Ta bort taggar (radbrytningar → mellanslag), avkoda entiteter, normalisera.
 * Notreferenser (`<a epub:type="noteref">37</a>`) tas bort *med* sin innertext,
 * så slutnots-siffror inte hamnar i verstexten.
 */
export const cleanHtml = (fragment: string): string =>
  decodeEntities(
    fragment
      .replace(/<a\b[^>]*epub:type="noteref"[^>]*>[\s\S]*?<\/a>/gi, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim()
