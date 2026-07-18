import { readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { BIBLE_META } from './meta'
import type { NormalizedWork } from '../model'

// Fixture adapter: reads a selection of the 1917 Bible from a local file so the
// whole chain ingest → API → reader can be verified without a network (getbible is
// blocked in the sandbox). On the VPS the getbible adapter is used for the whole Bible instead.
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
