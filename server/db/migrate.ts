import type Database from 'better-sqlite3'

// Rå SQL-migrering (samma mönster som newsAgg): idempotent, körs vid uppstart.
export const runMigrations = (sqlite: Database.Database): void => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS works (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      tradition TEXT NOT NULL,
      author TEXT NOT NULL,
      lang TEXT NOT NULL,
      translation TEXT NOT NULL,
      license TEXT NOT NULL,
      source_url TEXT NOT NULL,
      translated INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      verse_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      work_id TEXT NOT NULL,
      name TEXT NOT NULL,
      abbrev TEXT NOT NULL,
      position INTEGER NOT NULL,
      chapter_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS books_work_idx ON books(work_id, position);

    CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      orig_text TEXT
    );
    CREATE INDEX IF NOT EXISTS verses_chapter_idx ON verses(book_id, chapter, verse);
    CREATE INDEX IF NOT EXISTS verses_work_idx ON verses(work_id);
  `)

  // FTS5-index för snabb fritextsök över verser. External-content mot verses,
  // så vi slipper dubbellagra texten; join tillbaka på rowid för metadata.
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(
      text,
      content='verses',
      content_rowid='id',
      tokenize='unicode61 remove_diacritics 2'
    );

    CREATE TRIGGER IF NOT EXISTS verses_ai AFTER INSERT ON verses BEGIN
      INSERT INTO verses_fts(rowid, text) VALUES (new.id, new.text);
    END;
    CREATE TRIGGER IF NOT EXISTS verses_ad AFTER DELETE ON verses BEGIN
      INSERT INTO verses_fts(verses_fts, rowid, text) VALUES('delete', old.id, old.text);
    END;
    CREATE TRIGGER IF NOT EXISTS verses_au AFTER UPDATE ON verses BEGIN
      INSERT INTO verses_fts(verses_fts, rowid, text) VALUES('delete', old.id, old.text);
      INSERT INTO verses_fts(rowid, text) VALUES (new.id, new.text);
    END;
  `)
}
