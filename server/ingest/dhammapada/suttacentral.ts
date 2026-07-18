import { fetchJson } from '../../lib/fetchJson'
import { mapPool } from '../../lib/concurrency'
import { buildTranslatedWork, type RawChapter } from '../lib/chapters'
import { DHAMMAPADA_VAGGAS, type Vagga } from './vaggas'
import type { NormalizedWork, WorkMeta } from '../model'

// Dhammapada from SuttaCentral's bilara-data (CC0): English (Bhikkhu Sujato) +
// Pali (Mahāsaṅgīti). Translated into Swedish via Ollama at ingest.
const BASE = 'https://raw.githubusercontent.com/suttacentral/bilara-data/published'
const enUrl = (r: string): string =>
  `${BASE}/translation/en/sujato/sutta/kn/dhp/dhp${r}_translation-en-sujato.json`
const pliUrl = (r: string): string => `${BASE}/root/pli/ms/sutta/kn/dhp/dhp${r}_root-pli-ms.json`

type Segments = Record<string, string>

// Merge the segments (dhpN:1, dhpN:2 …) into one verse per verse number. Headings
// (dhpN:0.x) are skipped.
const collectVerses = (seg: Segments): Map<number, string> => {
  const parts = new Map<number, [number, string][]>()
  for (const [key, value] of Object.entries(seg)) {
    const match = /^dhp(\d+):(\d+(?:\.\d+)?)$/.exec(key)
    if (!match) continue
    const vnum = Number(match[1])
    const order = Number(match[2])
    if (order < 1) continue
    const arr = parts.get(vnum) ?? []
    arr.push([order, value])
    parts.set(vnum, arr)
  }
  const out = new Map<number, string>()
  for (const [vnum, arr] of parts) {
    arr.sort((a, b) => a[0] - b[0])
    out.set(vnum, arr.map(([, t]) => t.trim()).join(' ').replace(/\s+/g, ' ').trim())
  }
  return out
}

// Fetches a vagga and builds its raw chapter (English as source, Pali as
// originalText). The verse numbers are Dhammapada's global numbers, not 1..N.
const fetchVagga = async (vagga: Vagga): Promise<RawChapter> => {
  const [enSeg, pliSeg] = await Promise.all([
    fetchJson(enUrl(vagga.range)) as Promise<Segments>,
    fetchJson(pliUrl(vagga.range)) as Promise<Segments>,
  ])
  const en = collectVerses(enSeg)
  const pli = collectVerses(pliSeg)
  const nums = [...en.keys()].sort((a, b) => a - b)
  return {
    chapter: vagga.index,
    verses: nums.map((n) => ({ verse: n, source: en.get(n) ?? '', orig: pli.get(n) })),
  }
}

const metaFor = (translated: boolean): WorkMeta => ({
  id: 'dhammapada',
  title: 'Dhammapada',
  subtitle: 'Sanningens väg',
  tradition: 'Buddhism',
  author: 'Ur Buddhas undervisning',
  lang: 'Pali',
  translation: translated
    ? 'Svensk översättning (Ollama) från Bhikkhu Sujatos engelska'
    : 'Engelska: Bhikkhu Sujato',
  license: 'CC0 (SuttaCentral)',
  sourceUrl: 'https://suttacentral.net/dhp',
  translated,
})

/** Fetches the entire Dhammapada (26 vaggas), translates and normalizes it. */
export const suttacentralDhammapada = async (): Promise<NormalizedWork> => {
  const chapters = await mapPool(DHAMMAPADA_VAGGAS, 4, fetchVagga)
  const book = { slug: 'dhammapada', name: 'Dhammapada', abbrev: 'Dhp' }
  return buildTranslatedWork(chapters, book, metaFor, 4)
}
