import { useEffect, useState } from 'react';
import {
  buildDocumentPath,
  compressForStorage,
  generateDocumentFileName,
  moveFile,
} from '../../services/fileStorageService';
import { extractTextFromImage } from '../../services/ocrService';
import { parseDateFromText } from '../../services/dateParserService';
import { detectTitleFromOcrText } from '../../services/titleDetectorService';
import { generateThumbnail } from '../../services/thumbnailService';
import { insertDocument } from '../../db/documentsRepository';
import { insertActivity } from '../../db/activityRepository';
import { notifyLibraryChanged } from '../../stores/libraryStore';
import type { DateSource, DocumentRecord } from '../../types/models';

type DetectionResult = {
  date: Date;
  source: DateSource;
  ocrText: string | null;
  detectedTitle: string | null;
};

export function useCaptureFlow(photoUri: string) {
  const [isDetecting, setIsDetecting] = useState(true);
  const [detection, setDetection] = useState<DetectionResult>({
    date: new Date(),
    source: 'today',
    ocrText: null,
    detectedTitle: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ocr = await extractTextFromImage(photoUri);
      if (cancelled) return;
      const parsed = ocr.text ? parseDateFromText(ocr.text) : null;
      const title = ocr.text ? detectTitleFromOcrText(ocr.text) : null;
      if (cancelled) return;
      setDetection({
        date: parsed?.date ?? new Date(),
        source: parsed ? 'ocr' : 'today',
        ocrText: ocr.text || null,
        detectedTitle: title,
      });
      setIsDetecting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [photoUri]);

  function overrideDate(date: Date) {
    setDetection((prev) => ({ ...prev, date, source: 'manual' }));
  }

  function overrideTitle(title: string | null) {
    setDetection((prev) => ({ ...prev, detectedTitle: title }));
  }

  async function saveCapturedDocument(): Promise<DocumentRecord> {
    const year = detection.date.getFullYear();
    const month = detection.date.getMonth() + 1;
    const fileName = generateDocumentFileName('jpg');
    const targetPath = buildDocumentPath(year, month, fileName);
    const compressed = await compressForStorage(photoUri);
    await moveFile(compressed.uri, targetPath);
    const thumbnailPath = await generateThumbnail(targetPath, fileName);

    const cleanedTitle = detection.detectedTitle?.trim() || null;
    const documentRecord = await insertDocument({
      filePath: targetPath,
      thumbnailPath,
      documentYear: year,
      documentMonth: month,
      documentDate: formatIsoDate(detection.date),
      dateSource: detection.source,
      ocrText: detection.ocrText,
      title: cleanedTitle,
    });

    await insertActivity({
      activityType: 'created',
      documentId: documentRecord.id,
      documentTitle: documentRecord.title ?? formatHumanDate(detection.date),
      toYear: year,
      toMonth: month,
    });
    notifyLibraryChanged();
    return documentRecord;
  }

  return {
    isDetecting,
    detectedDate: detection.date,
    detectionSource: detection.source,
    detectedTitle: detection.detectedTitle,
    overrideDate,
    overrideTitle,
    saveCapturedDocument,
  };
}

function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatHumanDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
