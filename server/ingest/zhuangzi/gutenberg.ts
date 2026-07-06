import { fetchText } from '../../lib/fetchText'
import { gutenbergBody } from '../lib/gutenberg'
import { buildTranslatedWork, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Zhuangzi, Herbert A. Giles engelska översättning (public domain) via Project
// Gutenberg. 33 kapitel, vart och ett med en titel + Giles "_Argument_"-
// sammanfattning (bägge redaktionella, hoppas över) och brödtext i stycken.
const URL =
  'https://raw.githubusercontent.com/GITenberg/Chuang-Tzu-Mystic-Moralist-and-Social-Reformer_59709/master/59709-0.txt'
const HEADER = /^CHAPTER [IVXLCM]+\.\s*$/m

// Rensa ett kapitel till brödtextstycken. Indragna block är Giles glosor/
// fotnoter (inkl. "_Argument_") och hoppas över; hakparentes-redaktion likaså;
// fotnotshänvisningar ([12]) tas bort; första stycket (titeln) slängs.
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
  // Klipp bort register (_INDEX_) och transkriberingsnot som ligger före END.
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
