import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'docorg.db';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (databaseInstance) return databaseInstance;
  databaseInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await runMigrations(databaseInstance);
  return databaseInstance;
}

async function runMigrations(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS documents (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      filePath        TEXT NOT NULL,
      thumbnailPath   TEXT NOT NULL,
      documentYear    INTEGER NOT NULL,
      documentMonth   INTEGER NOT NULL,
      documentDate    TEXT NOT NULL,
      dateSource      TEXT NOT NULL,
      ocrText         TEXT,
      title           TEXT,
      createdAt       TEXT NOT NULL
    );
  `);
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_docs_year_month
    ON documents(documentYear, documentMonth);
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS activity (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      activityType    TEXT NOT NULL,
      documentId      INTEGER,
      documentTitle   TEXT,
      fromYear        INTEGER,
      fromMonth       INTEGER,
      toYear          INTEGER,
      toMonth         INTEGER,
      timestamp       TEXT NOT NULL
    );
  `);
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_activity_ts
    ON activity(timestamp DESC);
  `);
}
