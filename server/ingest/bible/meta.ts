import type { WorkMeta } from '../model'

// Shared metadata for the work "Bibeln" — the same whether the text comes from
// getbible (VPS) or the fixture file (local verification).
export const BIBLE_META: WorkMeta = {
  id: 'bibel-1917',
  title: 'Bibeln',
  subtitle: '1917 års kyrkobibel',
  tradition: 'Kristendom',
  author: 'Bibelkommissionen',
  lang: 'Hebreiska, arameiska, grekiska',
  translation: '1917 års kyrkobibel',
  license: 'Public Domain (Projekt Runeberg)',
  sourceUrl: 'https://api.getbible.net/v2/swedish.json',
  translated: false,
}
