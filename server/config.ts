import path from 'node:path'

const cwd = process.cwd()

/** Central runtime configuration, read once from the environment. */
export const config = {
  port: Number(process.env['PORT'] ?? 8080),
  // Bind address. Omitted ⇒ all interfaces (0.0.0.0), which is required for
  // Docker's port mapping to reach the server. Set only to bind a specific network.
  host: process.env['HOST'],
  // The SQLite file. Mounted as a volume on the VPS (like newsAgg), never in git.
  dbPath: process.env['DATABASE_URL'] ?? path.resolve(cwd, 'data', 'visdomsatlasen.db'),
  // The built SPA files the server serves alongside the API.
  staticDir: process.env['STATIC_DIR'] ?? path.resolve(cwd, 'dist'),
  // Bearer token protecting POST /api/ingest (writes to the database).
  // newsAgg's UPDATE_TOKEN works as a fallback.
  ingestToken: process.env['INGEST_TOKEN'] ?? process.env['UPDATE_TOKEN'],
  // Shared access code that hides the whole app behind a code page (tester mode).
  // Omitted ⇒ gate off (dev + Tailscale-only is open as before).
  accessCode: process.env['ACCESS_CODE'],
} as const
