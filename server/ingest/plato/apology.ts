import { fetchText } from '../../lib/fetchText'
import { cleanHtml } from '../lib/html'
import { buildTranslatedWork, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Platons Försvarstal (Apology), Benjamin Jowetts engelska (public domain) via
// Standard Ebooks samlingsvolym Dialogues. Vi tar själva talet (`apology-text`)
// och hoppar över Jowetts inledning (`apology-introduction`). Talet är
// sammanhängande: ett kapitel, varje stycke en vers.
const URL =
  'https://raw.githubusercontent.com/standardebooks/plato_dialogues_benjamin-jowett/master/src/epub/text/apology.xhtml'

const parseApology = (xhtml: string): RawChapter[] => {
  const section = /<section id="apology-text"[^>]*>([\s\S]*?)<\/section>/.exec(xhtml)
  if (!section) throw new Error('Försvarstalet: hittade inte talet (apology-text)')
  const verses = [...(section[1] ?? '').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
    .map((p) => cleanHtml(p[1] ?? ''))
    .filter((t) => t.length > 0)
    .map((source, i) => ({ verse: i + 1, source }))
  if (verses.length === 0) throw new Error('Försvarstalet: inga stycken')
  return [{ chapter: 1, verses }]
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'forsvarstalet',
  title: 'Sokrates försvarstal',
  subtitle: 'Apologia',
  tradition: 'Antik grekisk filosofi',
  author: 'Platon',
  lang: 'Grekiska',
  translation: translated
    ? 'Svensk översättning (Ollama) från Benjamin Jowetts engelska'
    : 'Engelska: Benjamin Jowett',
  license: 'Public Domain (Standard Ebooks)',
  sourceUrl: 'https://standardebooks.net/ebooks/plato/dialogues/benjamin-jowett',
  translated,
})

export const platoApology = async (): Promise<NormalizedWork> => {
  const chapters = parseApology(await fetchText(URL))
  const book = { slug: 'forsvarstalet', name: 'Försvarstalet', abbrev: 'Apol' }
  return buildTranslatedWork(chapters, book, metaFor, 4)
}
