import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { Image as ExpoImage, type ImageLoadEventData } from 'expo-image';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, type RouteProp, useFocusEffect } from '@react-navigation/native';
import { MotiView } from 'moti';
import * as Print from 'expo-print';

import { DocumentActionsBar } from './DocumentActionsBar';
import { ShareFolderSheet } from '../share/ShareFolderSheet';
import { useFolderShare } from '../share/useFolderShare';
import { palette, radii, spacing } from '../../ui/theme';
import { timingTransition } from '../../ui/motion';
import { useSnackbar } from '../../ui/SnackbarHost';
import { deleteDocument, getDocumentById, updateDocumentTitle } from '../../db/documentsRepository';
import { insertActivity } from '../../db/activityRepository';
import { deleteFile, getFileSizeBytes } from '../../services/fileStorageService';
import { notifyLibraryChanged } from '../../stores/libraryStore';
import type { LibraryStackParamList } from '../../navigation/screens';
import type { DocumentRecord } from '../../types/models';

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function DocumentDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<LibraryStackParamList, 'DocumentDetail'>>();
  const showSnackbar = useSnackbar((s) => s.show);
  const folderShare = useFolderShare();

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ sizeBytes: number | null; width: number | null; height: number | null }>({
    sizeBytes: null,
    width: null,
    height: null,
  });

  const loadDocument = useCallback(async () => {
    const doc = await getDocumentById(route.params.documentId);
    setDocument(doc);
    setEditedTitle(doc?.title ?? '');
  }, [route.params.documentId]);

  useFocusEffect(
    useCallback(() => {
      loadDocument();
    }, [loadDocument]),
  );

  useEffect(() => {
    if (!document) return;
    const monthName = FULL_MONTHS[document.documentMonth - 1];
    navigation.setOptions({ title: `${monthName} ${document.documentYear}` });
  }, [document, navigation]);

  useEffect(() => {
    if (!document) return;
    let cancelled = false;
    (async () => {
      const size = await getFileSizeBytes(document.filePath);
      if (cancelled) return;
      setFileInfo((prev) => ({ ...prev, sizeBytes: size }));
    })();
    return () => {
      cancelled = true;
    };
  }, [document]);

  const handleImageLoad = useCallback((event: ImageLoadEventData) => {
    const { width, height } = event.source ?? {};
    if (typeof width === 'number' && typeof height === 'number') {
      setFileInfo((prev) => ({ ...prev, width, height }));
    }
  }, []);

  if (!document) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  async function commitTitle() {
    if (!document) return;
    const trimmed = editedTitle.trim();
    if (trimmed === (document.title ?? '')) return;
    await updateDocumentTitle(document.id, trimmed);
    notifyLibraryChanged();
  }

  function handleAction(action: 'move' | 'share' | 'pdf' | 'print' | 'delete') {
    if (!document) return;
    if (action === 'move') {
      navigation.navigate('MoveDocument', { documentId: document.id });
    } else if (action === 'share' || action === 'pdf') {
      setShareSheetVisible(true);
    } else if (action === 'print') {
      printDocument();
    } else if (action === 'delete') {
      confirmDelete();
    }
  }

  async function printDocument() {
    if (!document) return;
    try {
      const html = `<!doctype html><html><body style="margin:0;padding:0;"><img src="${document.filePath}" style="width:100%;height:auto;display:block;" /></body></html>`;
      await Print.printAsync({ html });
    } catch (err) {
      showSnackbar({ message: 'Could not open print dialog', kind: 'error' });
    }
  }

  function confirmDelete() {
    if (!document) return;
    Alert.alert(
      'Delete document?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const snapshot = document;
            try {
              await deleteDocument(snapshot.id);
            } catch (err) {
              showSnackbar({ message: 'Delete failed', kind: 'error' });
              return;
            }
            await deleteFile(snapshot.filePath);
            await deleteFile(snapshot.thumbnailPath);
            try {
              await insertActivity({
                activityType: 'deleted',
                documentId: null,
                documentTitle: snapshot.title ?? snapshot.documentDate,
                fromYear: snapshot.documentYear,
                fromMonth: snapshot.documentMonth,
              });
            } catch {
              // Activity log is best-effort; the document is already deleted.
            }
            notifyLibraryChanged();
            showSnackbar({ message: 'Document deleted', kind: 'info' });
            navigation.goBack();
          },
        },
      ],
    );
  }

  const sourceBadge = badgeFor(document.dateSource);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MotiView
          from={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={timingTransition(320)}
        >
          <Pressable
            style={styles.imageWrap}
            onPress={() =>
              navigation.navigate('DocumentViewer', {
                year: document!.documentYear,
                month: document!.documentMonth,
                documentId: document!.id,
              })
            }
          >
            <ExpoImage
              source={document.filePath}
              style={styles.fullImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={180}
              onLoad={handleImageLoad}
            />
            <Text style={styles.zoomHint}>Tap to open · pinch to zoom</Text>
          </Pressable>
        </MotiView>

        <View style={styles.metaCard}>
          <TextInput
            label="Title"
            value={editedTitle}
            onChangeText={setEditedTitle}
            onBlur={commitTitle}
            placeholder={'e.g. "Lease agreement"'}
            mode="outlined"
            outlineColor={palette.outline}
            activeOutlineColor={palette.primary}
            style={styles.titleInput}
          />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{formatDateLong(document.documentDate)}</Text>
            </View>
            <View style={[styles.sourcePill, { backgroundColor: sourceBadge.bg }]}>
              <Text style={[styles.sourceText, { color: sourceBadge.fg }]}>{sourceBadge.label}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Folder</Text>
              <Text style={styles.metaValue}>
                {FULL_MONTHS[document.documentMonth - 1]} {document.documentYear}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Added</Text>
              <Text style={styles.metaValue}>{formatRelative(document.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Size</Text>
              <Text style={styles.metaValue}>{formatFileSize(fileInfo.sizeBytes)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Dimensions</Text>
              <Text style={styles.metaValue}>
                {fileInfo.width && fileInfo.height
                  ? `${fileInfo.width} × ${fileInfo.height} px`
                  : '—'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <DocumentActionsBar onAction={handleAction} />

      <ShareFolderSheet
        visible={shareSheetVisible}
        onDismiss={() => setShareSheetVisible(false)}
        title="this document"
        documents={[document]}
        isExporting={folderShare.isExporting}
        onExportPdf={() =>
          folderShare.sharePdf({ title: `DocOrg-doc-${document.id}`, documents: [document] }).finally(() =>
            setShareSheetVisible(false),
          )
        }
        onExportZip={() =>
          folderShare.shareZip({ title: `DocOrg-doc-${document.id}`, documents: [document] }).finally(() =>
            setShareSheetVisible(false),
          )
        }
      />
    </View>
  );
}

function badgeFor(source: string) {
  if (source === 'ocr') return { label: 'Detected from document', bg: palette.accentContainer, fg: '#92400E' };
  if (source === 'manual') return { label: 'Set by you', bg: palette.primaryContainer, fg: palette.primaryDark };
  return { label: 'Today at capture', bg: palette.surfaceVariant, fg: palette.onSurfaceVariant };
}

function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${FULL_MONTHS[(m ?? 1) - 1]} ${d}, ${y}`;
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < 60_000) return 'just now';
  if (diffMs < 60 * 60_000) return `${Math.floor(diffMs / 60_000)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / (60 * 60_000))} h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} d ago`;
  return new Date(iso).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  scrollContent: { paddingBottom: spacing.xl },
  imageWrap: {
    backgroundColor: palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    alignSelf: 'center',
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: 480,
  },
  zoomHint: {
    fontSize: 11,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  metaCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    gap: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 1,
  },
  titleInput: { backgroundColor: palette.white },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, alignItems: 'center' },
  metaItem: { flex: 1 },
  metaLabel: { color: palette.onSurfaceVariant, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  metaValue: { color: palette.onSurface, fontSize: 15, fontWeight: '600', marginTop: 2 },
  sourcePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  sourceText: { fontSize: 12, fontWeight: '600' },
});
