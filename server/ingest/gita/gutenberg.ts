import { fetchText } from '../../lib/fetchText'
import { gutenbergBody } from '../lib/gutenberg'
import { buildTranslatedWork, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Bhagavad Gita i Sir Edwin Arnolds versöversättning "The Song Celestial"
// (public domain) via Project Gutenberg. 18 sånger; varje strof (blankrads-
// separerat block) blir en vers. Arnolds fotnoter ([FN#…]) och kapitlens
// avslutande kolofon ("HERE ENDETH CHAPTER …") sållas bort.
const URL =
  'https://raw.githubusercontent.com/GITenberg/The-Song-Celestial--Or-Bhagavad-G-t---from-the-Mah-bh-rata---13-Being-a-discourse-between-Arju__2388/master/2388.txt'

const stanzas = (chunk: string): string[] =>
  chunk
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .replace(/\[FN#?[^\]]*\]/g, '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((text) => text.length > 0 && !/^HERE END(ETH|S)\b/i.test(text))

const parseGita = (raw: string): RawChapter[] => {
  const body = gutenbergBody(raw)
  const start = body.search(/^\s*CHAPTER I$/m)
  // Fotnotsdefinitionerna ([FN#1] …) ligger samlade sist; klipp bort dem.
  const notes = body.search(/^\[FN#?\d+\]/m)
  if (start < 0) throw new Error('Bhagavad Gita: hittade inte CHAPTER I')
  const chapters = body
    .slice(start, notes > start ? notes : body.length)
    .split(/^\s*CHAPTER [IVXLC]+\s*$/m)
    .slice(1)
    .map((chunk, i) => ({
      chapter: i + 1,
      verses: stanzas(chunk).map((source, j) => ({ verse: j + 1, source })),
    }))
  if (chapters.length !== 18) throw new Error(`Bhagavad Gita: förväntade 18 sånger, fick ${chapters.length}`)
  return chapters
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'bhagavad-gita',
  title: 'Bhagavad Gita',
  subtitle: 'Herrens sång',
  tradition: 'Hinduism',
  author: 'Vyasa',
  lang: 'Sanskrit',
  translation: translated
    ? 'Svensk översättning (Ollama) från Edwin Arnolds engelska'
    : 'Engelska: Edwin Arnold (The Song Celestial)',
  license: 'Public Domain (Project Gutenberg)',
  sourceUrl: 'https://www.gutenberg.org/ebooks/2388',
  translated,
})

export const bhagavadGita = async (): Promise<NormalizedWork> => {
  const chapters = parseGita(await fetchText(URL))
  const book = { slug: 'bhagavad-gita', name: 'Bhagavad Gita', abbrev: 'Gita' }
  return buildTranslatedWork(chapters, book, metaFor, 4)
}
