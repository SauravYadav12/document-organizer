import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from '../../ui/PressableScale';
import { palette, radii, spacing } from '../../ui/theme';

type ActionKey = 'move' | 'share' | 'pdf' | 'print' | 'delete';

type Props = {
  onAction: (action: ActionKey) => void;
};

const ACTIONS: Array<{ key: ActionKey; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; danger?: boolean }> = [
  { key: 'move', icon: 'folder-move', label: 'Move' },
  { key: 'share', icon: 'share-variant', label: 'Share' },
  { key: 'pdf', icon: 'file-pdf-box', label: 'PDF' },
  { key: 'print', icon: 'printer', label: 'Print' },
  { key: 'delete', icon: 'trash-can-outline', label: 'Delete', danger: true },
];

export function DocumentActionsBar({ onAction }: Props) {
  return (
    <View style={styles.row}>
      {ACTIONS.map((action) => (
        <PressableScale
          key={action.key}
          onPress={() => onAction(action.key)}
          style={styles.button}
        >
          <View style={[styles.iconWrap, action.danger && styles.iconWrapDanger]}>
            <MaterialCommunityIcons
              name={action.icon}
              size={22}
              color={action.danger ? palette.error : palette.primary}
            />
          </View>
          <Text style={[styles.label, action.danger && styles.labelDanger]}>{action.label}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.outline,
  },
  button: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: { backgroundColor: '#FEE2E2' },
  label: { fontSize: 12, fontWeight: '600', color: palette.onSurface },
  labelDanger: { color: palette.error },
});
