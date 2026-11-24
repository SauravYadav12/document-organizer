import { useState } from 'react';
import * as Sharing from 'expo-sharing';
import { buildPdfFromDocuments } from '../../services/pdfExportService';
import { buildZipFromDocuments } from '../../services/zipExportService';
import { insertActivity } from '../../db/activityRepository';
import { notifyLibraryChanged } from '../../stores/libraryStore';
import { useSnackbar } from '../../ui/SnackbarHost';
import type { DocumentRecord } from '../../types/models';

type ShareInput = {
  title: string;
  documents: DocumentRecord[];
};

export function useFolderShare() {
  const showSnackbar = useSnackbar((s) => s.show);
  const [isExporting, setIsExporting] = useState(false);

  async function sharePdf({ title, documents }: ShareInput) {
    if (documents.length === 0) {
      showSnackbar({ message: 'Nothing to share yet', kind: 'info' });
      return;
    }
    setIsExporting(true);
    try {
      const pdfUri = await buildPdfFromDocuments({ title, documents });
      await openShareSheet(pdfUri, 'application/pdf');
      await insertActivity({
        activityType: 'shared',
        documentId: documents.length === 1 ? documents[0].id : null,
        documentTitle: title,
      });
      notifyLibraryChanged();
    } catch (err) {
      showSnackbar({ message: 'Could not build PDF', kind: 'error' });
    } finally {
      setIsExporting(false);
    }
  }

  async function shareZip({ title, documents }: ShareInput) {
    if (documents.length === 0) {
      showSnackbar({ message: 'Nothing to share yet', kind: 'info' });
      return;
    }
    setIsExporting(true);
    try {
      const zipUri = await buildZipFromDocuments({ title, documents });
      await openShareSheet(zipUri, 'application/zip');
      await insertActivity({
        activityType: 'exported',
        documentId: documents.length === 1 ? documents[0].id : null,
        documentTitle: title,
      });
      notifyLibraryChanged();
    } catch (err) {
      showSnackbar({ message: 'Could not build archive', kind: 'error' });
    } finally {
      setIsExporting(false);
    }
  }

  return { sharePdf, shareZip, isExporting };
}

async function openShareSheet(uri: string, mimeType: string) {
  const available = await Sharing.isAvailableAsync();
  if (!available) return;
  await Sharing.shareAsync(uri, { mimeType, UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.zip-archive' });
}
