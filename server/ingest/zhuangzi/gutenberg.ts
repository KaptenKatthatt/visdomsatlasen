import { fetchText } from '../../lib/fetchText'
import { gutenbergBody } from '../lib/gutenberg'
import { buildTranslatedWork, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Zhuangzi, Herbert A. Giles' English translation (public domain) via Project
// Gutenberg. 33 chapters, each with a title + Giles' "_Argument_"
// summary (both editorial, skipped) and body text in paragraphs.
const URL =
  'https://raw.githubusercontent.com/GITenberg/Chuang-Tzu-Mystic-Moralist-and-Social-Reformer_59709/master/59709-0.txt'
const HEADER = /^CHAPTER [IVXLCM]+\.\s*$/m

// Reduce a chapter to body-text paragraphs. Indented blocks are Giles' glosses/
// footnotes (incl. "_Argument_") and are skipped; bracketed editorial likewise;
// footnote references ([12]) are removed; the first paragraph (the title) is discarded.
const chapterVerses = (chunk: string): string[] => {
  const verses = chunk
    .split(/\n\s*\n/)
    .filter((block) => !/^[ \t]/.test(block))
    .map((block) => block.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim())
    .filter((text) => text.length > 0 && !/^\[.*\]$/.test(text))
  return verses.slice(1)
}

const parseZhuangzi = (raw: string): RawChapter[] => {
  let body = gutenbergBody(raw)
  // Cut away the index (_INDEX_) and the transcriber's note that sit before END.
  for (const marker of [/\n_INDEX_/, /\nTranscriber.s Notes/]) {
    const hit = marker.exec(body)
    if (hit) body = body.slice(0, hit.index)
  }
  const chapters = body
    .split(HEADER)
    .slice(1)
    .map((chunk, i) => ({
      chapter: i + 1,
      verses: chapterVerses(chunk).map((source, j) => ({ verse: j + 1, source })),
    }))
  if (chapters.length !== 33) {
    throw new Error(`Zhuangzi: förväntade 33 kapitel, fick ${chapters.length}`)
  }
  return chapters
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'zhuangzi',
  title: 'Zhuangzi',
  subtitle: 'Mästaren Zhuang',
  tradition: 'Taoism',
  author: 'Zhuangzi',
  lang: 'Klassisk kinesiska',
  translation: translated
    ? 'Svensk översättning (Ollama) från Herbert Giles engelska'
    : 'Engelska: Herbert Giles',
  license: 'Public Domain (Project Gutenberg)',
  sourceUrl: 'https://www.gutenberg.org/ebooks/59709',
  translated,
})

export const gutenbergZhuangzi = async (): Promise<NormalizedWork> => {
  const chapters = parseZhuangzi(await fetchText(URL))
  const book = { slug: 'zhuangzi', name: 'Zhuangzi', abbrev: 'Zhz' }
  return buildTranslatedWork(chapters, book, metaFor, 4)
}
