import { zip } from 'react-native-zip-archive';
import { Directory, File } from 'expo-file-system';
import { fileStoragePaths } from './fileStorageService';
import type { DocumentRecord } from '../types/models';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type ZipOptions = {
  title: string;
  documents: DocumentRecord[];
};

export async function buildZipFromDocuments({ title, documents }: ZipOptions): Promise<string> {
  const stagingDir = new Directory(`${fileStoragePaths.temp}zip-${Date.now()}/`);
  stagingDir.create({ intermediates: true });

  try {
    for (const doc of documents) {
      const fileName = buildStagingFileName(doc);
      await new File(doc.filePath).copy(new File(stagingDir, fileName));
    }

    const safeTitle = title.replace(/[^A-Za-z0-9_\-]+/g, '-');
    const archiveUri = `${fileStoragePaths.temp}${safeTitle}-${Date.now()}.zip`;
    await zip(stripFilePrefix(stagingDir.uri), stripFilePrefix(archiveUri));
    return archiveUri.startsWith('file://') ? archiveUri : `file://${archiveUri}`;
  } finally {
    if (stagingDir.exists) {
      stagingDir.delete();
    }
  }
}

function buildStagingFileName(doc: DocumentRecord): string {
  const monthLabel = MONTH_NAMES[doc.documentMonth] ?? 'Unknown';
  const base = doc.title?.trim() || doc.documentDate;
  const safeBase = base.replace(/[^A-Za-z0-9_\- ]+/g, '').slice(0, 60).trim() || 'document';
  const extension = doc.filePath.split('.').pop() || 'jpg';
  return `${doc.documentYear}-${monthLabel}-${safeBase}-${doc.id}.${extension}`;
}

function stripFilePrefix(uri: string): string {
  return uri.startsWith('file://') ? uri.replace('file://', '') : uri;
}
