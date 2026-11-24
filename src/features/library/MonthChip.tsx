import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { PressableScale } from '../../ui/PressableScale';
import { palette, radii, spacing } from '../../ui/theme';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Props = {
  month: number;
  documentCount: number;
  selected: boolean;
  onPress: () => void;
};

function MonthChipBase({ month, documentCount, selected, onPress }: Props) {
  return (
    <PressableScale onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.month, selected && styles.monthSelected]}>
        {SHORT_MONTHS[month - 1]}
      </Text>
      <View style={[styles.badge, selected && styles.badgeSelected]}>
        <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
          {documentCount}
        </Text>
      </View>
    </PressableScale>
  );
}

export const MonthChip = memo(MonthChipBase);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    backgroundColor: palette.white,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: palette.outline,
  },
  chipSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  month: { fontWeight: '600', color: palette.onSurface, fontSize: 14, marginRight: spacing.sm },
  monthSelected: { color: palette.white },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  badgeText: { color: palette.primaryDark, fontWeight: '700', fontSize: 12 },
  badgeTextSelected: { color: palette.white },
});
