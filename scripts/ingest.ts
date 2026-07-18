#!/usr/bin/env node
import { runIngest, type IngestResult } from '../server/ingest/run'

// En läsbar rad per verk: översättningstäckning för verifiering på VPS:en.
const summarize = (r: IngestResult): string => {
  if (r.translatedVerses === null) return `  ${r.id}: ${r.verses} verser (svensk source)`
  const pct = r.verses > 0 ? Math.round((r.translatedVerses / r.verses) * 100) : 0
  const flag = r.translated ? '✓' : '⚠ under 50 %'
  return `  ${r.id}: ${r.translatedVerses}/${r.verses} verser översatta (${pct} %) ${flag}`
}

// CLI-ingest, körs t.ex. via cron på VPS:en (som newsAggs update-news.ts).
// Argument utan bindestreck tolkas som verk-id att köra; inga = alla.
const main = async (): Promise<void> => {
  const only = process.argv.slice(2).filter((arg) => !arg.startsWith('-'))
  const results = await runIngest(only.length > 0 ? only : undefined)
  console.log('Översättningstäckning:')
  for (const result of results) console.log(summarize(result))
  console.log(JSON.stringify(results, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[ingest] misslyckades:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
