import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { YearMonthPicker } from './YearMonthPicker';
import { palette, radii, spacing } from '../../ui/theme';
import { useSnackbar } from '../../ui/SnackbarHost';
import { getDocumentById, updateDocumentFolder } from '../../db/documentsRepository';
import { insertActivity } from '../../db/activityRepository';
import {
  buildDocumentPath,
  generateDocumentFileName,
  moveFile,
} from '../../services/fileStorageService';
import { notifyLibraryChanged } from '../../stores/libraryStore';
import type { LibraryStackParamList } from '../../navigation/screens';
import type { DocumentRecord } from '../../types/models';

export function MoveDocumentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<LibraryStackParamList, 'MoveDocument'>>();
  const showSnackbar = useSnackbar((s) => s.show);

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    (async () => {
      const doc = await getDocumentById(route.params.documentId);
      setDocument(doc);
      if (doc) {
        setYear(doc.documentYear);
        setMonth(doc.documentMonth);
      }
    })();
  }, [route.params.documentId]);

  if (!document) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const isSameFolder = year === document.documentYear && month === document.documentMonth;

  async function handleMove() {
    if (!document || isSameFolder || isMoving) return;
    setIsMoving(true);
    const original = document;
    try {
      await performMove(original, year, month);
      showSnackbar({
        message: `Moved to ${monthLabel(month)} ${year}`,
        kind: 'success',
        actionLabel: 'Undo',
        onActionPress: async () => {
          const current = await getDocumentById(original.id);
          if (current) {
            await performMove(current, original.documentYear, original.documentMonth);
          }
        },
      });
      navigation.goBack();
    } catch (err) {
      showSnackbar({ message: 'Move failed', kind: 'error' });
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Move to</Text>
      <Text style={styles.sub}>
        Currently in {monthLabel(document.documentMonth)} {document.documentYear}
      </Text>

      <YearMonthPicker
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
      />

      <Button
        mode="contained"
        onPress={handleMove}
        disabled={isSameFolder || isMoving}
        loading={isMoving}
        style={styles.confirmButton}
        contentStyle={styles.confirmContent}
        labelStyle={styles.confirmLabel}
      >
        Move here
      </Button>
    </View>
  );
}

async function performMove(document: DocumentRecord, newYear: number, newMonth: number) {
  const newFileName = generateDocumentFileName(extensionOf(document.filePath));
  const newPath = buildDocumentPath(newYear, newMonth, newFileName);
  const originalPath = document.filePath;
  await moveFile(originalPath, newPath);
  try {
    await updateDocumentFolder({
      id: document.id,
      newYear,
      newMonth,
      newFilePath: newPath,
    });
  } catch (err) {
    try {
      await moveFile(newPath, originalPath);
    } catch {
      // Best-effort rollback; the DB still points at the original path.
    }
    throw err;
  }
  try {
    await insertActivity({
      activityType: 'moved',
      documentId: document.id,
      documentTitle: document.title ?? document.documentDate,
      fromYear: document.documentYear,
      fromMonth: document.documentMonth,
      toYear: newYear,
      toMonth: newMonth,
    });
  } catch {
    // Activity log is best-effort; the move itself has already committed.
  }
  notifyLibraryChanged();
}

function extensionOf(uri: string): string {
  const dot = uri.lastIndexOf('.');
  return dot >= 0 ? uri.slice(dot + 1) : 'jpg';
}

function monthLabel(month: number): string {
  return ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'][month] ?? '';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  heading: { fontSize: 24, fontWeight: '700', color: palette.onSurface },
  sub: { color: palette.onSurfaceVariant, fontSize: 14 },
  confirmButton: { marginTop: 'auto', borderRadius: radii.lg, backgroundColor: palette.primary },
  confirmContent: { height: 56 },
  confirmLabel: { fontWeight: '700', fontSize: 16 },
});
