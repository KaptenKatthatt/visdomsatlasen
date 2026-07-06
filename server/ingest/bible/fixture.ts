import { readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { BIBLE_META } from './meta'
import type { NormalizedWork } from '../model'

// Fixture-adapter: läser ett urval av 1917 års bibel från en lokal fil så hela
// kedjan ingest → API → läsare kan verifieras utan nätverk (getbible är blockerad
// i sandboxen). På VPS:en används getbible-adaptern för hela bibeln i stället.
const verseSchema = z.object({
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  text: z.string().min(1),
})

const bookSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  abbrev: z.string().min(1),
  verses: z.array(verseSchema).min(1),
})

const fixtureSchema = z.object({ books: z.array(bookSchema).min(1) })

const fixturePath = (): string =>
  process.env['BIBLE_FIXTURE'] ??
  path.resolve(process.cwd(), 'data', 'fixtures', 'bible-1917-sample.json')

export const fixtureBible = async (): Promise<NormalizedWork> => {
  const raw = JSON.parse(readFileSync(fixturePath(), 'utf-8')) as unknown
  const parsed = fixtureSchema.parse(raw)
  return { meta: BIBLE_META, books: parsed.books }
}
