import { fetchText } from '../../lib/fetchText'
import { gutenbergBody } from '../lib/gutenberg'
import { buildTranslatedWork, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// The Prose Edda (Snorri's Edda), Rasmus B. Anderson's English (public domain)
// via Project Gutenberg. We take Gylfaginning ("The Fooling of Gylfe") — the
// coherent mythological narrative (the creation, the gods, Ragnarök). Bragi's
// dialogue and the commentary apparatus that follows (notes, index) are skipped.
const URL =
  'https://raw.githubusercontent.com/GITenberg/The-Younger-EddaAlso-called-Snorre-s-Edda-or-The-Prose-Edda_18947/master/18947-0.txt'

// The first match of `re` from `from` onward (so we find the body text's
// heading, not the table of contents' earlier occurrence of the same word).
const after = (body: string, re: string, from: number): number => {
  const rx = new RegExp(re, 'mg')
  rx.lastIndex = from
  const m = rx.exec(body)
  return m ? m.index : -1
}

// A chapter → verses. Blank-line-separated paragraphs; Anderson's `[Footnote …]`
// blocks and the chapter title (the first paragraph) are filtered out, footnote
// references ([8]) and the paragraph number ("1. ") are removed.
const chapterVerses = (chunk: string): string[] =>
  chunk
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0 && !/^\[Footnote/i.test(block))
    .slice(1)
    .map((block) => block.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').replace(/^\d+\.\s*/, '').trim())
    .filter((text) => text.length > 0)

const parseGylfaginning = (raw: string): RawChapter[] => {
  const body = gutenbergBody(raw)
  const foreword = after(body, '^FOREWORD\\.$', 0)
  const start = after(body, '^THE FOOLING OF GYLFE\\.$', foreword)
  const end = after(body, '^AFTERWORD$', start)
  if (foreword < 0 || start < 0 || end < 0) throw new Error('Prosaiska Eddan: hittade inte Gylfaginning')
  const chapters = body
    .slice(start, end)
    .split(/^CHAPTER [IVXLC]+\.$/mg)
    .slice(1)
    .map((chunk, i) => ({
      chapter: i + 1,
      verses: chapterVerses(chunk).map((source, j) => ({ verse: j + 1, source })),
    }))
  if (chapters.length !== 17) throw new Error(`Prosaiska Eddan: förväntade 17 kapitel, fick ${chapters.length}`)
  return chapters
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'prosaiska-eddan',
  title: 'Prosaiska Eddan',
  subtitle: 'Gylfaginning',
  tradition: 'Fornnordiskt',
  author: 'Snorre Sturlasson',
  lang: 'Fornisländska',
  translation: translated
    ? 'Svensk översättning (Ollama) från Rasmus B. Andersons engelska'
    : 'Engelska: Rasmus B. Anderson',
  license: 'Public Domain (Project Gutenberg)',
  sourceUrl: 'https://www.gutenberg.org/ebooks/18947',
  translated,
})

export const proseEdda = async (): Promise<NormalizedWork> => {
  const chapters = parseGylfaginning(await fetchText(URL))
  const book = { slug: 'gylfaginning', name: 'Gylfaginning', abbrev: 'Gylf' }
  return buildTranslatedWork(chapters, book, metaFor, 4)
}
