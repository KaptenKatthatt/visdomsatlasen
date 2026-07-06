#!/usr/bin/env node
import { runIngest } from '../server/ingest/run'

// CLI-ingest, körs t.ex. via cron på VPS:en (som newsAggs update-news.ts).
// Argument utan bindestreck tolkas som verk-id att köra; inga = alla.
const main = async (): Promise<void> => {
  const only = process.argv.slice(2).filter((arg) => !arg.startsWith('-'))
  const results = await runIngest(only.length > 0 ? only : undefined)
  console.log(JSON.stringify(results, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[ingest] misslyckades:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
