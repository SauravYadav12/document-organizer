import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from '../../ui/PressableScale';
import { palette, radii, spacing } from '../../ui/theme';
import type { DocumentRecord } from '../../types/models';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  documents: DocumentRecord[];
  isExporting: boolean;
  onExportZip: () => void;
  /**
   * Only passed from single-document contexts (DocumentDetail). Folder-level
   * share hides this: folders don't make sense as PDFs because they hold
   * unrelated scans; a combined PDF comes from multi-select instead.
   */
  onExportPdf?: () => void;
};

export function ShareFolderSheet({
  visible,
  onDismiss,
  title,
  documents,
  isExporting,
  onExportZip,
  onExportPdf,
}: Props) {
  const showPdf = typeof onExportPdf === 'function';
  const zipDescription = showPdf
    ? 'Original photo as sent by the camera.'
    : 'Every original photo in one archive. To send one combined PDF, long-press a document and pick the ones you want.';

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.sheet}
      >
        <View style={styles.grabber} />
        <Text style={styles.heading}>Share {title}</Text>
        <Text style={styles.sub}>
          {documents.length} {documents.length === 1 ? 'document' : 'documents'} · stays on your device until you send it
        </Text>

        {showPdf ? (
          <PressableScale onPress={onExportPdf} style={styles.optionCard} disabled={isExporting}>
            <View style={styles.optionIconWrap}>
              <MaterialCommunityIcons name="file-pdf-box" size={32} color={palette.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Share as PDF</Text>
              <Text style={styles.optionDesc}>One tidy file, opens anywhere.</Text>
            </View>
          </PressableScale>
        ) : null}

        <PressableScale onPress={onExportZip} style={styles.optionCard} disabled={isExporting}>
          <View style={[styles.optionIconWrap, styles.zipIconWrap]}>
            <MaterialCommunityIcons name="folder-zip" size={32} color={'#92400E'} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{showPdf ? 'Share original photo' : 'Share as ZIP'}</Text>
            <Text style={styles.optionDesc}>{zipDescription}</Text>
          </View>
        </PressableScale>

        {isExporting ? (
          <View style={styles.exportingRow}>
            <ActivityIndicator color={palette.primary} />
            <Text style={styles.exportingText}>Preparing share…</Text>
          </View>
        ) : null}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    marginHorizontal: 0,
    marginBottom: 0,
    marginTop: 'auto',
    gap: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.outline,
    marginBottom: spacing.sm,
  },
  heading: { fontSize: 18, fontWeight: '700', color: palette.onSurface },
  sub: { color: palette.onSurfaceVariant, fontSize: 13 },
  optionCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.outline,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zipIconWrap: { backgroundColor: palette.accentContainer },
  optionText: { flex: 1, gap: 4 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: palette.onSurface },
  optionDesc: { fontSize: 12, color: palette.onSurfaceVariant, lineHeight: 16 },
  exportingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  exportingText: { color: palette.onSurfaceVariant, fontSize: 13 },
});
