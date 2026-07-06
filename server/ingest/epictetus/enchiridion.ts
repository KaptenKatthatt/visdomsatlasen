import { fetchText } from '../../lib/fetchText'
import { parseStandardEbook } from '../lib/standardebooks'
import { buildTranslatedWork, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Epiktetos Handbok (Enchiridion), George Longs engelska översättning (public
// domain) via Standard Ebooks. 53 korta kapitel; varje kapitel blir ett kapitel,
// varje stycke en vers. Översätts till svenska.
const URL =
  'https://raw.githubusercontent.com/standardebooks/epictetus_short-works_george-long/master/src/epub/text/the-enchiridion.xhtml'

const parseEnchiridion = (xhtml: string): RawChapter[] => {
  const chapters = parseStandardEbook(xhtml)
  if (chapters.length !== 53) {
    throw new Error(`Handboken: förväntade 53 kapitel, fick ${chapters.length}`)
  }
  return chapters
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'enchiridion',
  title: 'Handboken',
  subtitle: 'Enchiridion',
  tradition: 'Stoicism',
  author: 'Epiktetos',
  lang: 'Grekiska',
  translation: translated
    ? 'Svensk översättning (Ollama) från George Longs engelska'
    : 'Engelska: George Long',
  license: 'Public Domain (Standard Ebooks)',
  sourceUrl: 'https://standardebooks.net/ebooks/epictetus/short-works/george-long',
  translated,
})

export const epictetusEnchiridion = async (): Promise<NormalizedWork> => {
  const chapters = parseEnchiridion(await fetchText(URL))
  const book = { slug: 'handboken', name: 'Handboken', abbrev: 'Ench.' }
  return buildTranslatedWork(chapters, book, metaFor, 4)
}
