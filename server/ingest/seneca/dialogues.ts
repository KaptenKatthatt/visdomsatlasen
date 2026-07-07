import { fetchText } from '../../lib/fetchText'
import { parseStandardEbook } from '../lib/standardebooks'
import { buildTranslatedMultiBook, type NamedBook } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Senecas Dialoger, Aubrey Stewarts engelska (public domain) via Standard
// Ebooks. Varje dialog = en fil = en namngiven bok med romerskt numrerade kapitel.
const BASE =
  'https://raw.githubusercontent.com/standardebooks/seneca_dialogues_aubrey-stewart/master/src/epub/text'

type Dialogue = { file: string; name: string }
const DIALOGUES: Dialogue[] = [
  { file: 'on-the-shortness-of-life', name: 'Om livets korthet' },
  { file: 'on-a-happy-life', name: 'Om det lyckliga livet' },
  { file: 'on-anger', name: 'Om vreden' },
  { file: 'on-peace-of-mind', name: 'Om sinnesro' },
  { file: 'on-providence', name: 'Om försynen' },
  { file: 'on-the-firmness-of-the-wise-person', name: 'Om den vises ståndaktighet' },
  { file: 'on-leisure', name: 'Om ledigheten' },
  { file: 'on-clemency', name: 'Om mildhet' },
  { file: 'on-benefits', name: 'Om välgärningar' },
  { file: 'to-marcia-on-consolation', name: 'Tröst till Marcia' },
  { file: 'to-helvia-on-consolation', name: 'Tröst till Helvia' },
  { file: 'to-polybius-on-consolation', name: 'Tröst till Polybius' },
]

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'seneca-dialoger',
  title: 'Dialoger',
  subtitle: 'Moralfilosofiska essäer',
  tradition: 'Stoicism',
  author: 'Seneca',
  lang: 'Latin',
  translation: translated
    ? 'Svensk översättning (Ollama) från Aubrey Stewarts engelska'
    : 'Engelska: Aubrey Stewart',
  license: 'Public Domain (Standard Ebooks)',
  sourceUrl: 'https://standardebooks.net/ebooks/seneca/dialogues/aubrey-stewart',
  translated,
})

export const senecaDialogues = async (): Promise<NormalizedWork> => {
  const books: NamedBook[] = []
  for (const dialogue of DIALOGUES) {
    const chapters = parseStandardEbook(await fetchText(`${BASE}/${dialogue.file}.xhtml`))
    if (chapters.length === 0) throw new Error(`Seneca ${dialogue.file}: inga kapitel`)
    books.push({ info: { slug: dialogue.file, name: dialogue.name, abbrev: dialogue.name }, chapters })
  }
  return buildTranslatedMultiBook(books, metaFor, 4)
}
