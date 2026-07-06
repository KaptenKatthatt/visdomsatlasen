import { fetchText } from '../../lib/fetchText'
import { gutenbergBody } from '../lib/gutenberg'
import { buildTranslatedWork, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Prosaiska Eddan (Snorres Edda), Rasmus B. Andersons engelska (public domain)
// via Project Gutenberg. Vi tar Gylfaginning ("The Fooling of Gylfe") — den
// sammanhållna mytologiska berättelsen (skapelsen, gudarna, Ragnarök). Brages
// samtal och den efterföljande kommentarapparaten (noter, register) hoppas över.
const URL =
  'https://raw.githubusercontent.com/GITenberg/The-Younger-EddaAlso-called-Snorre-s-Edda-or-The-Prose-Edda_18947/master/18947-0.txt'

// Första matchningen av `re` från och med `from` (så vi hittar brödtextens
// rubrik, inte innehållsförteckningens tidigare förekomst av samma ord).
const after = (body: string, re: string, from: number): number => {
  const rx = new RegExp(re, 'mg')
  rx.lastIndex = from
  const m = rx.exec(body)
  return m ? m.index : -1
}

// Ett kapitel → verser. Blankradsseparerade stycken; Andersons `[Footnote …]`-
// block och kapiteltiteln (första stycket) sållas bort, fotnotshänvisningar
// ([8]) och stycknumret ("1. ") tas bort.
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
