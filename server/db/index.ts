import path from 'node:path'
import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { config } from '../config'
import * as schema from './schema'
import { runMigrations } from './migrate'

const dbPath = path.resolve(config.dbPath)
// Create the data directory if it's missing (first start in an empty volume).
mkdirSync(path.dirname(dbPath), { recursive: true })

export const sqlite: Database.Database = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
runMigrations(sqlite)

export const db = drizzle(sqlite, { schema })
