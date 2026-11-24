import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, FlatList } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { MotiView } from 'moti';

import { MonthChip } from './MonthChip';
import { DocumentTile } from './DocumentTile';
import { useFolderDocuments, useMonthList } from './useLibraryData';
import { EmptyState } from '../../ui/EmptyState';
import { ShareFolderSheet } from '../share/ShareFolderSheet';
import { useFolderShare } from '../share/useFolderShare';
import { palette, spacing } from '../../ui/theme';
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
  const folderShare = useFolderShare();

  useEffect(() => {
    if (months.length > 0 && selectedMonth === null) {
      setSelectedMonth(months[months.length - 1].month);
    }
  }, [months, selectedMonth]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        selectedMonth !== null ? (
          <IconButton
            icon="share-variant"
            onPress={() => setShareSheetVisible(true)}
          />
        ) : null,
    });
  }, [navigation, selectedMonth]);

  const { documents } = useFolderDocuments(year, selectedMonth ?? 0);

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
          onPress={() => navigation.navigate('DocumentDetail', { documentId: item.id })}
        />
      </MotiView>
    ),
    [navigation],
  );

  const monthLabel = useMemo(
    () => (selectedMonth ? FULL_MONTHS[selectedMonth - 1] : ''),
    [selectedMonth],
  );

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
          {monthLabel} {year}
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
        contentContainerStyle={styles.gridContent}
        renderItem={renderItem}
      />

      <ShareFolderSheet
        visible={shareSheetVisible}
        onDismiss={() => setShareSheetVisible(false)}
        title={`${monthLabel} ${year}`}
        documents={documents}
        isExporting={folderShare.isExporting}
        onExportPdf={() =>
          folderShare.sharePdf({ title: `DocOrg-${monthLabel}-${year}`, documents }).finally(() => setShareSheetVisible(false))
        }
        onExportZip={() =>
          folderShare.shareZip({ title: `DocOrg-${monthLabel}-${year}`, documents }).finally(() => setShareSheetVisible(false))
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
  tileWrapper: { flex: 1 / 3 },
});
