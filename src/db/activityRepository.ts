import { getDatabase } from './database';
import type { ActivityRecord, ActivityType } from '../types/models';

type NewActivityInput = {
  activityType: ActivityType;
  documentId: number | null;
  documentTitle: string | null;
  fromYear?: number | null;
  fromMonth?: number | null;
  toYear?: number | null;
  toMonth?: number | null;
};

export async function insertActivity(input: NewActivityInput): Promise<void> {
  const db = await getDatabase();
  const timestamp = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO activity
     (activityType, documentId, documentTitle, fromYear, fromMonth, toYear, toMonth, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.activityType,
      input.documentId,
      input.documentTitle,
      input.fromYear ?? null,
      input.fromMonth ?? null,
      input.toYear ?? null,
      input.toMonth ?? null,
      timestamp,
    ],
  );
}

export async function listRecentActivity(limit = 50, offset = 0): Promise<ActivityRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<ActivityRecord>(
    `SELECT * FROM activity ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
}
