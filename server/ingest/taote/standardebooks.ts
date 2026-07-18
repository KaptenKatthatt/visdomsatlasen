import { fetchText } from '../../lib/fetchText'
import { parseStandardEbook } from '../lib/standardebooks'
import { buildTranslatedWork, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Tao Te Ching, James Legges translation (public domain) via Standard Ebooks.
// 81 kapitel; varje kapitel blir ett kapitel, varje stycke en vers.
const URL =
  'https://raw.githubusercontent.com/standardebooks/laozi_tao-te-ching_james-legge/master/src/epub/text/tao-te-ching.xhtml'

const parseTao = (xhtml: string): RawChapter[] => {
  const chapters = parseStandardEbook(xhtml)
  if (chapters.length !== 81) {
    throw new Error(`Tao Te Ching: förväntade 81 kapitel, fick ${chapters.length}`)
  }
  return chapters
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'tao-te-ching',
  title: 'Tao Te Ching',
  subtitle: 'Vägen och dygden',
  tradition: 'Taoism',
  author: 'Laozi',
  lang: 'Klassisk kinesiska',
  translation: translated
    ? 'Svensk translation (Ollama) från James Legges engelska'
    : 'Engelska: James Legge',
  license: 'Public Domain (Standard Ebooks)',
  sourceUrl: 'https://standardebooks.net/ebooks/laozi/tao-te-ching/james-legge',
  translated,
})

export const standardebooksTaoTeChing = async (): Promise<NormalizedWork> => {
  const chapters = parseTao(await fetchText(URL))
  const book = { slug: 'tao-te-ching', name: 'Tao Te Ching', abbrev: 'TTK' }
  return buildTranslatedWork(chapters, book, metaFor, 4)
}
