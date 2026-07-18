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

// Decode a numeric code point, but only if it is valid — otherwise it is dropped
// (fromCodePoint throws RangeError for values > 0x10FFFF, which would otherwise
// bring down the whole ingest).
const codePoint = (n: number): string => (n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '')

const decodeEntities = (text: string): string =>
  text
    .replace(/&#(\d+);/g, (_, n: string) => codePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => codePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name: string) => NAMED[name] ?? m)

/**
 * Strip tags (line breaks → spaces), decode entities, normalize.
 * Note references (`<a epub:type="noteref">37</a>`) are removed *along with* their inner text,
 * so endnote digits do not end up in the verse text.
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
