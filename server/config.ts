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
  // Bearer-token som skyddar POST /api/ingest (skrivningar mot databasen).
  // newsAggs UPDATE_TOKEN duger som fallback.
  ingestToken: process.env['INGEST_TOKEN'] ?? process.env['UPDATE_TOKEN'],
  // Delad åtkomstkod som gömmer hela appen bakom en kod-sida (testarläget).
  // Utelämnad ⇒ spärren av (dev + Tailscale-only är öppet som förr).
  accessCode: process.env['ACCESS_CODE'],
} as const
