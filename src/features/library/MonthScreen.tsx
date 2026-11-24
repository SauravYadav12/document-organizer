import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, FlatList } from 'react-native';
import { Text, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { MotiView } from 'moti';

import { MonthChip } from './MonthChip';
import { DocumentTile } from './DocumentTile';
import { useFolderDocuments, useMonthList } from './useLibraryData';
import { EmptyState } from '../../ui/EmptyState';
import { ShareFolderSheet } from '../share/ShareFolderSheet';
import { useFolderShare } from '../share/useFolderShare';
import { palette, radii, spacing } from '../../ui/theme';
import { staggerStep, timingTransition } from '../../ui/motion';
import type { LibraryStackParamList } from '../../navigation/screens';
import type { DocumentRecord } from '../../types/models';

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<LibraryStackParamList, 'Month'>>();
  const { year } = route.params;
  const { months } = useMonthList(year);

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const folderShare = useFolderShare();

  const selectionMode = selectedIds.size > 0;

  useEffect(() => {
    if (months.length > 0 && selectedMonth === null) {
      setSelectedMonth(months[months.length - 1].month);
    }
  }, [months, selectedMonth]);

  // Reset selection when the user changes month.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectedMonth]);

  const { documents } = useFolderDocuments(year, selectedMonth ?? 0);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const toggleSelected = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(documents.map((d) => d.id)));
  }, [documents]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: selectionMode
        ? () => (
            <IconButton
              icon="close"
              onPress={clearSelection}
              accessibilityLabel="Cancel selection"
            />
          )
        : undefined,
      headerRight: () => {
        if (selectionMode) {
          const allSelected = selectedIds.size === documents.length;
          return (
            <IconButton
              icon={allSelected ? 'select-off' : 'select-all'}
              onPress={allSelected ? clearSelection : selectAll}
              accessibilityLabel={allSelected ? 'Deselect all' : 'Select all'}
            />
          );
        }
        if (selectedMonth !== null && documents.length > 0) {
          return (
            <IconButton
              icon="share-variant"
              onPress={() => setShareSheetVisible(true)}
              accessibilityLabel="Share folder"
            />
          );
        }
        return null;
      },
    });
  }, [navigation, selectionMode, selectedMonth, documents, selectedIds, clearSelection, selectAll]);

  const renderItem = useCallback(
    ({ item, index }: { item: DocumentRecord; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={timingTransition(280, Math.min(index, 8) * staggerStep)}
        style={styles.tileWrapper}
      >
        <DocumentTile
          thumbnailPath={item.thumbnailPath}
          documentDate={item.documentDate}
          title={item.title}
          selectable={selectionMode}
          selected={selectedIds.has(item.id)}
          onLongPress={() => toggleSelected(item.id)}
          onPress={() => {
            if (selectionMode) {
              toggleSelected(item.id);
            } else {
              navigation.navigate('DocumentDetail', { documentId: item.id });
            }
          }}
        />
      </MotiView>
    ),
    [navigation, selectionMode, selectedIds, toggleSelected],
  );

  const monthLabel = useMemo(
    () => (selectedMonth ? FULL_MONTHS[selectedMonth - 1] : ''),
    [selectedMonth],
  );

  const selectedDocuments = useMemo(
    () => documents.filter((d) => selectedIds.has(d.id)),
    [documents, selectedIds],
  );

  async function handleShareSelectedAsPdf() {
    if (selectedDocuments.length === 0) return;
    const title = `DocOrg-${monthLabel}-${year}-${selectedDocuments.length}-docs`;
    await folderShare.sharePdf({ title, documents: selectedDocuments });
    clearSelection();
  }

  if (months.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="folder-open-outline"
          title="Nothing in this year"
          subtitle="Capture a document and we'll file it here automatically."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {months.map((m) => (
          <MonthChip
            key={m.month}
            month={m.month}
            documentCount={m.documentCount}
            selected={m.month === selectedMonth}
            onPress={() => setSelectedMonth(m.month)}
          />
        ))}
      </ScrollView>

      <View style={styles.headerRow}>
        <Text style={styles.monthHeading}>
          {selectionMode ? `${selectedIds.size} selected` : `${monthLabel} ${year}`}
        </Text>
        <Text style={styles.docCount}>
          {documents.length} {documents.length === 1 ? 'document' : 'documents'}
        </Text>
      </View>

      <FlatList
        style={styles.grid}
        data={documents}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        contentContainerStyle={[
          styles.gridContent,
          selectionMode ? styles.gridContentWithBar : null,
        ]}
        renderItem={renderItem}
      />

      {selectionMode ? (
        <MotiView
          from={{ translateY: 80, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={timingTransition(220)}
          style={styles.selectionBar}
        >
          <Text style={styles.selectionHint} numberOfLines={1}>
            Share {selectedIds.size} selected as one combined PDF
          </Text>
          <Button
            mode="contained"
            onPress={handleShareSelectedAsPdf}
            disabled={folderShare.isExporting}
            loading={folderShare.isExporting}
            icon="file-pdf-box"
            style={styles.shareButton}
            labelStyle={styles.shareButtonLabel}
          >
            Share PDF
          </Button>
        </MotiView>
      ) : null}

      {folderShare.isExporting && !selectionMode ? (
        <View style={styles.exportingOverlay}>
          <ActivityIndicator color={palette.white} />
        </View>
      ) : null}

      <ShareFolderSheet
        visible={shareSheetVisible}
        onDismiss={() => setShareSheetVisible(false)}
        title={`${monthLabel} ${year}`}
        documents={documents}
        isExporting={folderShare.isExporting}
        onExportZip={() =>
          folderShare
            .shareZip({ title: `DocOrg-${monthLabel}-${year}`, documents })
            .finally(() => setShareSheetVisible(false))
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  chipsScroll: { flexGrow: 0, flexShrink: 0 },
  chipsRow: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  grid: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  monthHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.onSurface,
  },
  docCount: { color: palette.onSurfaceVariant, fontSize: 13, fontWeight: '500' },
  gridContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  gridContentWithBar: { paddingBottom: 120 },
  tileWrapper: { flex: 1 / 3 },
  selectionBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: palette.white,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 20,
    elevation: 6,
  },
  selectionHint: {
    flex: 1,
    color: palette.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: palette.primary,
    borderRadius: radii.lg,
  },
  shareButtonLabel: { fontWeight: '700', fontSize: 14 },
  exportingOverlay: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15,23,42,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
