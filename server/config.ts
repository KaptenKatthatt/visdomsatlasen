import path from 'node:path'

const cwd = process.cwd()

/** Central runtime configuration, read once from the environment. */
export const config = {
  port: Number(process.env['PORT'] ?? 8080),
  // Bind-adress. Utelämnad ⇒ alla gränssnitt (0.0.0.0), vilket krävs för att
  // Dockers port-mappning ska nå servern. Sätt bara för att binda ett visst nät.
  host: process.env['HOST'],
  // SQLite-filen. Monteras som volym på VPS:en (som newsAgg), aldrig i git.
  dbPath: process.env['DATABASE_URL'] ?? path.resolve(cwd, 'data', 'visdomsatlasen.db'),
  // Byggda SPA-filerna som servern levererar tillsammans med API:t.
  staticDir: process.env['STATIC_DIR'] ?? path.resolve(cwd, 'dist'),
  auth: {
    // Faller tillbaka på newsAggs variabelnamn, så samma .env kan återanvändas.
    user: process.env['ATLAS_USER'] ?? process.env['NEWSAGG_USER'],
    pass: process.env['ATLAS_PASS'] ?? process.env['NEWSAGG_PASS'],
  },
  // Bearer-token som låter cron/ingest-skript nå /api/ingest utan basic auth.
  // newsAggs UPDATE_TOKEN duger som fallback.
  ingestToken: process.env['INGEST_TOKEN'] ?? process.env['UPDATE_TOKEN'],
} as const
