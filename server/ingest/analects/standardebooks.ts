import { fetchText } from '../../lib/fetchText'
import { cleanHtml } from '../lib/html'
import { buildTranslatedWork, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Konfucius Samtal (Analekterna), James Legges engelska (public domain) via
// Standard Ebooks. 20 böcker (en fil per bok) blir 20 numrerade kapitel; varje
// underavsnitt (`z3998:subchapter`) är ett traditionellt yttrande = en vers.
// Underavsnittets `<h3>`-ordningsrubrik hoppas över; dess stycken blir versen.
const BASE =
  'https://raw.githubusercontent.com/standardebooks/confucius_analects_james-legge/master/src/epub/text'

const sayings = (xhtml: string): { verse: number; source: string }[] => {
  const subRe = /<section id="chapter-\d+-(\d+)"[^>]*epub:type="[^"]*subchapter[^"]*"[^>]*>([\s\S]*?)<\/section>/g
  const out: { verse: number; source: string }[] = []
  for (let m = subRe.exec(xhtml); m !== null; m = subRe.exec(xhtml)) {
    const source = [...(m[2] ?? '').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
      .map((p) => cleanHtml(p[1] ?? ''))
      .filter((t) => t.length > 0)
      .join(' ')
    if (source.length > 0) out.push({ verse: Number(m[1] ?? '0'), source })
  }
  return out
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'analekterna',
  title: 'Analekterna',
  subtitle: 'Samtalen',
  tradition: 'Konfucianism',
  author: 'Konfucius',
  lang: 'Klassisk kinesiska',
  translation: translated
    ? 'Svensk översättning (Ollama) från James Legges engelska'
    : 'Engelska: James Legge',
  license: 'Public Domain (Standard Ebooks)',
  sourceUrl: 'https://standardebooks.net/ebooks/confucius/analects/james-legge',
  translated,
})

export const analects = async (): Promise<NormalizedWork> => {
  const chapters: RawChapter[] = []
  for (let book = 1; book <= 20; book += 1) {
    const verses = sayings(await fetchText(`${BASE}/chapter-${book}.xhtml`))
    if (verses.length === 0) throw new Error(`Analekterna bok ${book}: inga yttranden`)
    chapters.push({ chapter: book, verses })
  }
  const book = { slug: 'analekterna', name: 'Analekterna', abbrev: 'Anal' }
  return buildTranslatedWork(chapters, book, metaFor, 4)
}
