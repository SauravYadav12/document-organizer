import { getDatabase } from './database';
import type { DocumentRecord, MonthSummary, YearSummary } from '../types/models';

type NewDocumentInput = Omit<DocumentRecord, 'id' | 'createdAt'>;

export async function insertDocument(input: NewDocumentInput): Promise<DocumentRecord> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO documents
     (filePath, thumbnailPath, documentYear, documentMonth, documentDate, dateSource, ocrText, title, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.filePath,
      input.thumbnailPath,
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
  return db.getAllAsync<DocumentRecord>(
    `SELECT * FROM documents
     WHERE documentYear = ? AND documentMonth = ?
     ORDER BY documentDate DESC, id DESC
     LIMIT ? OFFSET ?`,
    [year, month, limit, offset],
  );
}

export async function getDocumentById(id: number): Promise<DocumentRecord | null> {
  const db = await getDatabase();
  return db.getFirstAsync<DocumentRecord>(`SELECT * FROM documents WHERE id = ?`, [id]);
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
  if (params.newDocumentDate) {
    await db.runAsync(
      `UPDATE documents
       SET documentYear = ?, documentMonth = ?, filePath = ?, documentDate = ?
       WHERE id = ?`,
      [params.newYear, params.newMonth, params.newFilePath, params.newDocumentDate, params.id],
    );
  } else {
    await db.runAsync(
      `UPDATE documents
       SET documentYear = ?, documentMonth = ?, filePath = ?
       WHERE id = ?`,
      [params.newYear, params.newMonth, params.newFilePath, params.id],
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
