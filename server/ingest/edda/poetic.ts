import { fetchText } from '../../lib/fetchText'
import { gutenbergBody } from '../lib/gutenberg'
import { buildTranslatedMultiBook, type NamedBook, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Poetiska Eddan, Henry Adams Bellows engelska (public domain) via Project
// Gutenberg. Vi tar Gudakvädena (de mytologiska dikterna). Bellows tunga noter
// sållas bort: bara numrerade strofer (rad `N.` med cesuren `|`) behålls.
const URL =
  'https://raw.githubusercontent.com/GITenberg/The-poetic-Edda-b-Translated-from-the-Icelandic-with-an-Introduction-and-notes_73533/master/73533-0.txt'

type Poem = { title: string; name: string; slug: string }
const POEMS: Poem[] = [
  { title: 'VOLUSPO', name: 'Völuspá', slug: 'voluspa' },
  { title: 'HOVAMOL', name: 'Hávamál', slug: 'havamal' },
  { title: 'VAFTHRUTHNISMOL', name: 'Vaftrudnesmål', slug: 'vaftrudnesmal' },
  { title: 'GRIMNISMOL', name: 'Grimnesmål', slug: 'grimnesmal' },
  { title: 'SKIRNISMOL', name: 'Skirnesmål', slug: 'skirnesmal' },
  { title: 'HARBARTHSLJOTH', name: 'Härbardsljod', slug: 'harbardsljod' },
  { title: 'HYMISKVITHA', name: 'Hymeskvädet', slug: 'hymeskvadet' },
  { title: 'LOKASENNA', name: 'Lokasenna', slug: 'lokasenna' },
  { title: 'THRYMSKVITHA', name: 'Trymskvädet', slug: 'trymskvadet' },
  { title: 'ALVISSMOL', name: 'Allvismål', slug: 'allvismal' },
  { title: 'BALDRS DRAUMAR', name: 'Balders drömmar', slug: 'balders-drommar' },
  { title: 'RIGSTHULA', name: 'Rigstula', slug: 'rigstula' },
  { title: 'HYNDLULJOTH', name: 'Hyndlas sång', slug: 'hyndluljod' },
  { title: 'SVIPDAGSMOL', name: 'Svipdagsmål', slug: 'svipdagsmal' },
]

// En strof = ett block som börjar med `N.` och innehåller cesuren `|`. Bellows
// prosanoter saknar båda och sållas bort. Cesuren ersätts med mellanslag.
const stanzas = (text: string): { verse: number; source: string }[] =>
  text
    .split(/\n\s*\n/)
    .filter((block) => /^\d+\.\s/.test(block) && block.includes('|'))
    .map((block) => ({
      verse: Number(/^(\d+)\./.exec(block)?.[1] ?? '0'),
      source: block.replace(/^\d+\.\s*/, '').replace(/\s*\|\s*/g, ' ').replace(/\s+/g, ' ').trim(),
    }))

const titlePos = (body: string, title: string): number => {
  const re = new RegExp(`^${title}$`, 'mg')
  let pos = -1
  for (let m = re.exec(body); m !== null; m = re.exec(body)) pos = m.index
  return pos
}

const parsePoeticEdda = (raw: string): NamedBook[] => {
  const body = gutenbergBody(raw)
  const found = POEMS.map((p) => ({ poem: p, pos: titlePos(body, p.title) }))
    .filter((f) => f.pos >= 0)
    .sort((a, b) => a.pos - b.pos)
  return found.map((f, i) => {
    const end = i + 1 < found.length ? (found[i + 1]?.pos ?? body.length) : body.length
    const chapter: RawChapter = { chapter: 1, verses: stanzas(body.slice(f.pos, end)) }
    if (chapter.verses.length === 0) throw new Error(`Poetiska Eddan: ${f.poem.title} saknar strofer`)
    return { info: { slug: f.poem.slug, name: f.poem.name, abbrev: f.poem.name }, chapters: [chapter] }
  })
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'poetiska-eddan',
  title: 'Poetiska Eddan',
  subtitle: 'Gudakvädena',
  tradition: 'Fornnordiskt',
  author: 'Okända skalder',
  lang: 'Fornisländska',
  translation: translated
    ? 'Svensk översättning (Ollama) från Henry Adams Bellows engelska'
    : 'Engelska: Henry Adams Bellows',
  license: 'Public Domain (Project Gutenberg)',
  sourceUrl: 'https://www.gutenberg.org/ebooks/73533',
  translated,
})

export const poeticEdda = async (): Promise<NormalizedWork> => {
  const books = parsePoeticEdda(await fetchText(URL))
  if (books.length !== POEMS.length) {
    throw new Error(`Poetiska Eddan: förväntade ${POEMS.length} dikter, fick ${books.length}`)
  }
  return buildTranslatedMultiBook(books, metaFor, 4)
}
