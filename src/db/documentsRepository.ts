import { getDatabase } from './database';
import { toAbsoluteAppPath, toRelativeAppPath } from '../services/fileStorageService';
import type { DocumentRecord, MonthSummary, YearSummary } from '../types/models';

type NewDocumentInput = Omit<DocumentRecord, 'id' | 'createdAt'>;

type DocumentRow = Omit<DocumentRecord, 'filePath' | 'thumbnailPath'> & {
  filePath: string;
  thumbnailPath: string;
};

export async function insertDocument(input: NewDocumentInput): Promise<DocumentRecord> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const storedFilePath = toRelativeAppPath(input.filePath) ?? input.filePath;
  const storedThumbnailPath = toRelativeAppPath(input.thumbnailPath) ?? input.thumbnailPath;
  const result = await db.runAsync(
    `INSERT INTO documents
     (filePath, thumbnailPath, documentYear, documentMonth, documentDate, dateSource, ocrText, title, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      storedFilePath,
      storedThumbnailPath,
      input.documentYear,
      input.documentMonth,
      input.documentDate,
      input.dateSource,
      input.ocrText,
      input.title,
      createdAt,
    ],
  );
  return { ...input, id: result.lastInsertRowId, createdAt };
}

export async function listYears(): Promise<YearSummary[]> {
  const db = await getDatabase();
  return db.getAllAsync<YearSummary>(
    `SELECT documentYear AS year, COUNT(*) AS documentCount
     FROM documents
     GROUP BY documentYear
     ORDER BY documentYear DESC`,
  );
}

export async function listMonthsForYear(year: number): Promise<MonthSummary[]> {
  const db = await getDatabase();
  return db.getAllAsync<MonthSummary>(
    `SELECT documentYear AS year, documentMonth AS month, COUNT(*) AS documentCount
     FROM documents
     WHERE documentYear = ?
     GROUP BY documentMonth
     ORDER BY documentMonth ASC`,
    [year],
  );
}

export async function listDocumentsForFolder(
  year: number,
  month: number,
  limit = 100,
  offset = 0,
): Promise<DocumentRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DocumentRow>(
    `SELECT * FROM documents
     WHERE documentYear = ? AND documentMonth = ?
     ORDER BY documentDate DESC, id DESC
     LIMIT ? OFFSET ?`,
    [year, month, limit, offset],
  );
  return rows.map(hydratePaths);
}

export async function getDocumentById(id: number): Promise<DocumentRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DocumentRow>(`SELECT * FROM documents WHERE id = ?`, [id]);
  return row ? hydratePaths(row) : null;
}

export async function updateDocumentTitle(id: number, title: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE documents SET title = ? WHERE id = ?`, [title, id]);
}

export async function updateDocumentFolder(params: {
  id: number;
  newYear: number;
  newMonth: number;
  newFilePath: string;
  newDocumentDate?: string;
}): Promise<void> {
  const db = await getDatabase();
  const storedPath = toRelativeAppPath(params.newFilePath) ?? params.newFilePath;
  if (params.newDocumentDate) {
    await db.runAsync(
      `UPDATE documents
       SET documentYear = ?, documentMonth = ?, filePath = ?, documentDate = ?
       WHERE id = ?`,
      [params.newYear, params.newMonth, storedPath, params.newDocumentDate, params.id],
    );
  } else {
    await db.runAsync(
      `UPDATE documents
       SET documentYear = ?, documentMonth = ?, filePath = ?
       WHERE id = ?`,
      [params.newYear, params.newMonth, storedPath, params.id],
    );
  }
}

export async function deleteDocument(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM documents WHERE id = ?`, [id]);
}

export async function countAllDocuments(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM documents`);
  return row?.count ?? 0;
}

function hydratePaths(row: DocumentRow): DocumentRecord {
  return {
    ...row,
    filePath: toAbsoluteAppPath(row.filePath) ?? row.filePath,
    thumbnailPath: toAbsoluteAppPath(row.thumbnailPath) ?? row.thumbnailPath,
  };
}
