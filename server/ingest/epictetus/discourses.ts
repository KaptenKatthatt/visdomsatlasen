import { fetchText } from '../../lib/fetchText'
import { cleanHtml } from '../lib/html'
import { buildTranslatedMultiBook, type NamedBook, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Epictetus' Discourses, George Long's English (public domain) via
// Standard Ebooks. Four books (one file per book); inner chapters `chapter-<b>-<c>`.
// The chapter title (`<p epub:type="title">`) is skipped; body paragraphs become verses.
const BASE =
  'https://raw.githubusercontent.com/standardebooks/epictetus_discourses_george-long/master/src/epub/text'
const ROMAN = ['I', 'II', 'III', 'IV']

const chaptersFromFile = (xhtml: string): RawChapter[] => {
  const chapters: RawChapter[] = []
  const sectionRe = /<section id="chapter-\d+-(\d+)"[^>]*>([\s\S]*?)<\/section>/g
  let match: RegExpExecArray | null
  while ((match = sectionRe.exec(xhtml)) !== null) {
    const chapter = Number(match[1] ?? '0')
    const paragraphs = [
      ...(match[2] ?? '').matchAll(/<p\b(?![^>]*epub:type="title")[^>]*>([\s\S]*?)<\/p>/g),
    ]
      .map((p) => cleanHtml(p[1] ?? ''))
      .filter((t) => t.length > 0)
    chapters.push({ chapter, verses: paragraphs.map((source, i) => ({ verse: i + 1, source })) })
  }
  return chapters
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'epiktetos-samtal',
  title: 'Samtal',
  subtitle: 'Diatribai',
  tradition: 'Stoicism',
  author: 'Epiktetos',
  lang: 'Grekiska',
  translation: translated
    ? 'Svensk översättning (Ollama) från George Longs engelska'
    : 'Engelska: George Long',
  license: 'Public Domain (Standard Ebooks)',
  sourceUrl: 'https://standardebooks.net/ebooks/epictetus/discourses/george-long',
  translated,
})

export const epictetusDiscourses = async (): Promise<NormalizedWork> => {
  const books: NamedBook[] = []
  for (let n = 1; n <= 4; n += 1) {
    const chapters = chaptersFromFile(await fetchText(`${BASE}/book-${n}.xhtml`))
    if (chapters.length === 0) throw new Error(`Samtal bok ${n}: inga kapitel`)
    books.push({ info: { slug: `bok-${n}`, name: `Bok ${ROMAN[n - 1] ?? n}`, abbrev: `Bok ${n}` }, chapters })
  }
  return buildTranslatedMultiBook(books, metaFor, 4)
}
