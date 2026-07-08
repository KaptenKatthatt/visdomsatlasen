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
  // Översättningsverifiering. translatedVerses = antal verser som faktiskt fick
  // svensk text (null för verk som redan är på svenska, t.ex. Bibeln).
  translated: boolean
  translatedVerses: number | null
}

// `translatable` = verket ska maskinöversättas (och bör därför ingest:as om det
// lagrats men inte översatts). Bibeln är redan på svenska och märks false.
type WorkBuilder = { id: string; translatable: boolean; build: () => Promise<NormalizedWork> }

// Bibeln kan byggas antingen från getbible (VPS, hela bibeln) eller från
// fixture-filen (lokal verifiering). Styrs av BIBLE_SOURCE=fixture.
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

// Ett verk i taget; ett fel på ett verk stjälper inte de andra utan loggas.
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

// In-process-vakt: bara en ingest åt gången i samma process, så auto-ingest och
// ett samtidigt POST /api/ingest inte dubbelöversätter samma verk.
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

/** Kör ingest för valda verk (eller alla) och skriver dem till databasen. */
export const runIngest = (only?: string[]): Promise<IngestResult[]> => {
  const targets =
    only && only.length > 0 ? WORK_BUILDERS.filter((w) => only.includes(w.id)) : WORK_BUILDERS
  return ingestBuilders(targets)
}

/**
 * Ingest:ar de registrerade verk som saknas i databasen, samt översättbara verk
 * som lagrats men ännu inte översatts. Körs i bakgrunden vid serverstart, så ett
 * nyinlagt verk fylls på automatiskt och ett verk som fastnat på källspråket
 * (Ollama nere) fylls på nästa gång utan att redan översatta verk körs om.
 */
export const runMissingIngest = (): Promise<IngestResult[]> => {
  const status = workTranslatedById()
  const targets = WORK_BUILDERS.filter(
    (w) => !status.has(w.id) || (w.translatable && status.get(w.id) === false),
  )
  return ingestBuilders(targets)
}
