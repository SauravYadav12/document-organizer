export type DateSource = 'ocr' | 'today' | 'manual';

export type DocumentRecord = {
  id: number;
  filePath: string;
  thumbnailPath: string;
  documentYear: number;
  documentMonth: number;
  documentDate: string;
  dateSource: DateSource;
  ocrText: string | null;
  title: string | null;
  createdAt: string;
};

export type ActivityType = 'created' | 'moved' | 'deleted' | 'exported' | 'shared';

export type ActivityRecord = {
  id: number;
  activityType: ActivityType;
  documentId: number | null;
  documentTitle: string | null;
  fromYear: number | null;
  fromMonth: number | null;
  toYear: number | null;
  toMonth: number | null;
  timestamp: string;
};

export type FolderKey = {
  year: number;
  month: number;
};

export type YearSummary = {
  year: number;
  documentCount: number;
};

export type MonthSummary = {
  year: number;
  month: number;
  documentCount: number;
};
