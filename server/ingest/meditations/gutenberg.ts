import { fetchText } from '../../lib/fetchText'
import { buildTranslatedWork, type RawChapter } from '../lib/chapters'
import type { NormalizedWork, WorkMeta } from '../model'

// Marcus Aurelius Självbetraktelser, George Longs engelska översättning (public
// domain) via Project Gutenberg. Tolv böcker med romerskt numrerade sektioner;
// varje bok blir ett kapitel, varje sektion en vers. Översätts till svenska.
const URL = 'https://raw.githubusercontent.com/GITenberg/Meditations_2680/master/2680.txt'
const ORDINALS = 'FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVENTH|TWELFTH'
const HEADER = new RegExp(`^THE (?:${ORDINALS}) BOOK\\s*$`, 'm')
const SECTION = /^([IVXLCDM]+)\.\s/

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
const romanToInt = (s: string): number => {
  let total = 0
  for (let i = 0; i < s.length; i += 1) {
    const cur = ROMAN[s[i] ?? ''] ?? 0
    const next = ROMAN[s[i + 1] ?? ''] ?? 0
    total += cur < next ? -cur : cur
  }
  return total
}

const parseSections = (chunk: string): { num: number; text: string }[] =>
  chunk
    .split(/\n\s*\n(?=[IVXLCDM]+\.\s)/)
    .map((s) => s.trim())
    .map((s) => SECTION.exec(s))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ num: romanToInt(m[1] ?? ''), text: m.input.replace(SECTION, '').replace(/\s+/g, ' ').trim() }))

const parseMeditations = (raw: string): RawChapter[] => {
  const text = raw.replace(/\r/g, '')
  const start = text.indexOf('THE FIRST BOOK')
  const rest = text.slice(start < 0 ? 0 : start)
  // Bok XII följs av APPENDIX/NOTES (Longs noter) — klipp där så de inte tas med.
  const endMatch = /\n(?:THE APPENDIX|APPENDIX|NOTES)\s*\n/.exec(rest)
  const body = endMatch ? rest.slice(0, endMatch.index) : rest
  const chapters = body
    .split(HEADER)
    .slice(1)
    .map((chunk, i) => ({
      chapter: i + 1,
      verses: parseSections(chunk).map((sec) => ({ verse: sec.num, source: sec.text })),
    }))
  if (chapters.length !== 12) {
    throw new Error(`Självbetraktelser: förväntade 12 böcker, fick ${chapters.length}`)
  }
  return chapters
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'sjalvbetraktelser',
  title: 'Självbetraktelser',
  subtitle: 'Till sig själv',
  tradition: 'Stoicism',
  author: 'Marcus Aurelius',
  lang: 'Grekiska',
  translation: translated
    ? 'Svensk översättning (Ollama) från George Longs engelska'
    : 'Engelska: George Long',
  license: 'Public Domain (Project Gutenberg)',
  sourceUrl: 'https://www.gutenberg.org/ebooks/2680',
  translated,
})

export const gutenbergMeditations = async (): Promise<NormalizedWork> => {
  const chapters = parseMeditations(await fetchText(URL))
  const book = { slug: 'sjalvbetraktelser', name: 'Självbetraktelser', abbrev: 'Självbetr.' }
  return buildTranslatedWork(chapters, book, metaFor, 3)
}
