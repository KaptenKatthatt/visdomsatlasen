#!/usr/bin/env node
import { runIngest, type IngestResult } from '../server/ingest/run'
import { isTranslatedEnough } from '../server/ingest/coverage'

// En läsbar rad per verk: översättningstäckning för verifiering på VPS:en.
const summarize = (r: IngestResult): string => {
  if (r.translatedVerses === null) return `  ${r.id}: ${r.verses} verser (svensk source)`
  const pct = r.verses > 0 ? Math.round((r.translatedVerses / r.verses) * 100) : 0
  const flag = r.translated ? '✓' : '⚠ under 90 %'
  return `  ${r.id}: ${r.translatedVerses}/${r.verses} verser översatta (${pct} %) ${flag}`
}

const coverageFailed = (r: IngestResult): boolean =>
  r.translatedVerses !== null && !isTranslatedEnough(r.translatedVerses, r.verses)

// CLI-ingest. Kräver minst ett verk-id — aldrig «alla» via CLI (skyddar Bibeln
// och redan svenska verk). FORCE_RETRANSLATE=<id,id> behövs för att skriva över låsta.
const main = async (): Promise<void> => {
  const only = process.argv.slice(2).filter((arg) => !arg.startsWith('-'))
  if (only.length === 0) {
    console.error(
      '[ingest] Ange minst ett verk-id (t.ex. forsvarstalet). Bar `npm run ingest` är avstängt.',
    )
    process.exit(2)
  }
  const results = await runIngest(only)
  console.log('Översättningstäckning:')
  for (const result of results) console.log(summarize(result))
  console.log(JSON.stringify(results, null, 2))
  if (results.some(coverageFailed)) {
    console.error('[ingest] Ett eller flera verk landade under 90 % översättning.')
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[ingest] misslyckades:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
