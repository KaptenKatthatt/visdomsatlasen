import { storeWork } from '../library/store'
import { getbibleBible } from './bible/getbible'
import { fixtureBible } from './bible/fixture'
import { suttacentralDhammapada } from './dhammapada/suttacentral'
import { gutenbergMeditations } from './meditations/gutenberg'
import { standardebooksTaoTeChing } from './taote/standardebooks'
import type { NormalizedWork } from './model'

export type IngestResult = {
  id: string
  title: string
  verses: number
  // Översättningsverifiering. translatedVerses = antal verser som faktiskt fick
  // svensk text (null för verk som redan är på svenska, t.ex. Bibeln).
  translated: boolean
  translatedVerses: number | null
}
type WorkBuilder = { id: string; build: () => Promise<NormalizedWork> }

// Bibeln kan byggas antingen från getbible (VPS, hela bibeln) eller från
// fixture-filen (lokal verifiering). Styrs av BIBLE_SOURCE=fixture.
const buildBible = (): Promise<NormalizedWork> =>
  process.env['BIBLE_SOURCE'] === 'fixture' ? fixtureBible() : getbibleBible()

// Registret över verk. Varje verk exponerar en builder som ger normaliserad
// data. Fler traditioner (stoicism, taoism) läggs till här när de kopplas in.
const WORK_BUILDERS: WorkBuilder[] = [
  { id: 'bibel-1917', build: buildBible },
  { id: 'dhammapada', build: suttacentralDhammapada },
  { id: 'sjalvbetraktelser', build: gutenbergMeditations },
  { id: 'tao-te-ching', build: standardebooksTaoTeChing },
]

/** Kör ingest för valda verk (eller alla) och skriver dem till databasen. */
export const runIngest = async (only?: string[]): Promise<IngestResult[]> => {
  const targets =
    only && only.length > 0 ? WORK_BUILDERS.filter((w) => only.includes(w.id)) : WORK_BUILDERS
  const results: IngestResult[] = []
  for (const target of targets) {
    const work = await target.build()
    const verses = storeWork(work)
    results.push({
      id: work.meta.id,
      title: work.meta.title,
      verses,
      translated: work.meta.translated,
      translatedVerses: work.stats ? work.stats.translatedVerses : null,
    })
  }
  return results
}
