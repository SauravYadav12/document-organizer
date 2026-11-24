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
  onExportPdf: () => void;
  onExportZip: () => void;
};

export function ShareFolderSheet({
  visible,
  onDismiss,
  title,
  documents,
  isExporting,
  onExportPdf,
  onExportZip,
}: Props) {
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

        <View style={styles.optionsRow}>
          <PressableScale onPress={onExportPdf} style={styles.optionCard} disabled={isExporting}>
            <View style={styles.optionIconWrap}>
              <MaterialCommunityIcons name="file-pdf-box" size={32} color={palette.primary} />
            </View>
            <Text style={styles.optionTitle}>PDF</Text>
            <Text style={styles.optionDesc}>One tidy file, opens anywhere.</Text>
          </PressableScale>

          <PressableScale onPress={onExportZip} style={styles.optionCard} disabled={isExporting}>
            <View style={[styles.optionIconWrap, { backgroundColor: palette.accentContainer }]}>
              <MaterialCommunityIcons name="folder-zip" size={32} color={'#92400E'} />
            </View>
            <Text style={styles.optionTitle}>Originals</Text>
            <Text style={styles.optionDesc}>ZIP of original photos.</Text>
          </PressableScale>
        </View>

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
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  optionCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'flex-start',
    gap: 6,
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
    marginBottom: spacing.sm,
  },
  optionTitle: { fontSize: 16, fontWeight: '700', color: palette.onSurface },
  optionDesc: { fontSize: 12, color: palette.onSurfaceVariant },
  exportingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  exportingText: { color: palette.onSurfaceVariant, fontSize: 13 },
});
