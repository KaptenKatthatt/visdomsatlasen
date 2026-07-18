import { storeWork } from '../library/store'
import { workTranslatedById } from '../library/repository'
import { getbibleBible } from './bible/getbible'
import { fixtureBible } from './bible/fixture'
import { suttacentralDhammapada } from './dhammapada/suttacentral'
import { gutenbergMeditations } from './meditations/gutenberg'
import { standardebooksTaoTeChing } from './taote/standardebooks'
import { epictetusEnchiridion } from './epictetus/enchiridion'
import { gutenbergZhuangzi } from './zhuangzi/gutenberg'
import { epictetusDiscourses } from './epictetus/discourses'
import { senecaDialogues } from './seneca/dialogues'
import { poeticEdda } from './edda/poetic'
import { proseEdda } from './edda/prose'
import { analects } from './analects/standardebooks'
import { platoApology } from './plato/apology'
import type { NormalizedWork } from './model'

export type IngestResult = {
  id: string
  title: string
  verses: number
  // Translation verification. translatedVerses = number of verses that actually got
  // Swedish text (null for works that are already in Swedish, e.g. the Bible).
  translated: boolean
  translatedVerses: number | null
}

// `translatable` = the work should be machine-translated (and should therefore be
// re-ingested if it was stored but not translated). The Bible is already in Swedish and is marked false.
type WorkBuilder = { id: string; translatable: boolean; build: () => Promise<NormalizedWork> }

// The Bible can be built either from getbible (VPS, the whole bible) or from
// the fixture file (local verification). Controlled by BIBLE_SOURCE=fixture.
const buildBible = (): Promise<NormalizedWork> =>
  process.env['BIBLE_SOURCE'] === 'fixture' ? fixtureBible() : getbibleBible()

const WORK_BUILDERS: WorkBuilder[] = [
  { id: 'bibel-1917', translatable: false, build: buildBible },
  { id: 'dhammapada', translatable: true, build: suttacentralDhammapada },
  { id: 'sjalvbetraktelser', translatable: true, build: gutenbergMeditations },
  { id: 'tao-te-ching', translatable: true, build: standardebooksTaoTeChing },
  { id: 'enchiridion', translatable: true, build: epictetusEnchiridion },
  { id: 'zhuangzi', translatable: true, build: gutenbergZhuangzi },
  { id: 'epiktetos-samtal', translatable: true, build: epictetusDiscourses },
  { id: 'seneca-dialoger', translatable: true, build: senecaDialogues },
  { id: 'poetiska-eddan', translatable: true, build: poeticEdda },
  { id: 'prosaiska-eddan', translatable: true, build: proseEdda },
  { id: 'analekterna', translatable: true, build: analects },
  { id: 'forsvarstalet', translatable: true, build: platoApology },
]

// One work at a time; an error on one work does not bring down the others but is logged.
const ingestOne = async (builder: WorkBuilder): Promise<IngestResult | null> => {
  try {
    const work = await builder.build()
    const verses = storeWork(work)
    return {
      id: work.meta.id,
      title: work.meta.title,
      verses,
      translated: work.meta.translated,
      translatedVerses: work.stats ? work.stats.translatedVerses : null,
    }
  } catch (error) {
    console.error(`[ingest] ${builder.id} misslyckades:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

// In-process guard: only one ingest at a time in the same process, so auto-ingest and
// a concurrent POST /api/ingest do not double-translate the same work.
let ingestActive = false

const ingestBuilders = async (builders: WorkBuilder[]): Promise<IngestResult[]> => {
  if (ingestActive || builders.length === 0) return []
  ingestActive = true
  try {
    const results: IngestResult[] = []
    for (const builder of builders) {
      const result = await ingestOne(builder)
      if (result) results.push(result)
    }
    return results
  } finally {
    ingestActive = false
  }
}

/** Runs ingest for the selected works (or all) and writes them to the database. */
export const runIngest = (only?: string[]): Promise<IngestResult[]> => {
  const targets =
    only && only.length > 0 ? WORK_BUILDERS.filter((w) => only.includes(w.id)) : WORK_BUILDERS
  return ingestBuilders(targets)
}

/**
 * Ingests the registered works that are missing from the database, along with translatable
 * works that were stored but not yet translated. Runs in the background at server start, so a
 * newly added work is filled in automatically and a work stuck in the source language
 * (Ollama down) is filled in next time without re-running already translated works.
 */
export const runMissingIngest = (): Promise<IngestResult[]> => {
  const status = workTranslatedById()
  const targets = WORK_BUILDERS.filter(
    (w) => !status.has(w.id) || (w.translatable && status.get(w.id) === false),
  )
  return ingestBuilders(targets)
}
