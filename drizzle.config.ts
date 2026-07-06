import { defineConfig } from 'drizzle-kit'

// Endast för drizzle-kit-verktyg (studio/generate). Runtime-migreringen körs av
// server/db/migrate.ts, precis som i newsAgg.
export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? './data/visdomsatlasen.db',
  },
})
