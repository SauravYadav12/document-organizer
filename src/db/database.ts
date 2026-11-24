import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'docorg.db';
const DOCUMENT_ROOT_MARKER = 'docorg/';

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

  await migrateAbsolutePathsToRelative(db);
}

/**
 * Early builds stored full `file:///var/mobile/Containers/.../docorg/...`
 * paths in SQLite. iOS reassigns the sandbox GUID in that prefix on
 * reinstall and sometimes on Xcode re-sign, which left documents pointing
 * at dead URIs — their images stop rendering even though the file is
 * actually still on disk under the new sandbox. This migration rewrites
 * every stored path to the sandbox-relative portion (everything after
 * `docorg/`), so the runtime can re-base it on whatever the current
 * sandbox path happens to be.
 */
async function migrateAbsolutePathsToRelative(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>(`PRAGMA user_version`);
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= 1) return;

  const marker = `%${DOCUMENT_ROOT_MARKER}%`;
  await db.runAsync(
    `UPDATE documents
     SET filePath = substr(filePath, instr(filePath, ?) + ?)
     WHERE filePath LIKE ?`,
    [DOCUMENT_ROOT_MARKER, DOCUMENT_ROOT_MARKER.length, marker],
  );
  await db.runAsync(
    `UPDATE documents
     SET thumbnailPath = substr(thumbnailPath, instr(thumbnailPath, ?) + ?)
     WHERE thumbnailPath LIKE ?`,
    [DOCUMENT_ROOT_MARKER, DOCUMENT_ROOT_MARKER.length, marker],
  );
  await db.execAsync(`PRAGMA user_version = 1`);
}
