import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from '../../ui/PressableScale';
import { palette, radii, spacing } from '../../ui/theme';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Props = {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
};

export function YearMonthPicker({ year, month, onChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.yearRow}>
        <PressableScale onPress={() => onChange(year - 1, month)} style={styles.yearButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={palette.primary} />
        </PressableScale>
        <Text style={styles.yearText}>{year}</Text>
        <PressableScale onPress={() => onChange(year + 1, month)} style={styles.yearButton}>
          <MaterialCommunityIcons name="chevron-right" size={28} color={palette.primary} />
        </PressableScale>
      </View>

      <View style={styles.monthGrid}>
        {SHORT_MONTHS.map((label, index) => {
          const monthNumber = index + 1;
          const isSelected = monthNumber === month;
          return (
            <PressableScale
              key={label}
              onPress={() => onChange(year, monthNumber)}
              style={[styles.monthCell, isSelected && styles.monthCellSelected]}
            >
              <Text style={[styles.monthLabel, isSelected && styles.monthLabelSelected]}>
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.white,
    padding: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.lg,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    fontSize: 30,
    fontWeight: '700',
    color: palette.onSurface,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  monthCell: {
    flexBasis: '22%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.outline,
  },
  monthCellSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  monthLabel: { fontWeight: '600', color: palette.onSurface, fontSize: 14 },
  monthLabelSelected: { color: palette.white },
});
