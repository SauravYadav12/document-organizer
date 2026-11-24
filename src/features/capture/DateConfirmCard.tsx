import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import type { DateSource } from '../../types/models';
import { palette, radii, spacing } from '../../ui/theme';

type Props = {
  date: Date;
  source: DateSource;
  isDetecting: boolean;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function DateConfirmCard({ date, source, isDetecting }: Props) {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  return (
    <View style={styles.card}>
      <View style={styles.label}>
        <MaterialCommunityIcons
          name={isDetecting ? 'magnify-scan' : 'calendar-month'}
          size={18}
          color={palette.primary}
        />
        <Text style={styles.labelText}>
          {isDetecting ? 'Detecting date…' : 'Document date'}
        </Text>
      </View>

      <MotiView
        key={`${day}-${month}-${year}`}
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 280 }}
      >
        <Text style={styles.dateBig}>
          {month} {day}, {year}
        </Text>
      </MotiView>

      {!isDetecting ? (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 240, delay: 120 }}
          style={[styles.badge, badgeStyleFor(source)]}
        >
          <MaterialCommunityIcons name={badgeIconFor(source)} size={14} color={badgeIconColorFor(source)} />
          <Text style={[styles.badgeText, { color: badgeIconColorFor(source) }]}>
            {badgeTextFor(source)}
          </Text>
        </MotiView>
      ) : null}
    </View>
  );
}

function badgeStyleFor(source: DateSource) {
  if (source === 'ocr') return { backgroundColor: palette.accentContainer, borderColor: palette.accent };
  if (source === 'manual') return { backgroundColor: palette.primaryContainer, borderColor: palette.primary };
  return { backgroundColor: palette.surfaceVariant, borderColor: palette.outline };
}

function badgeIconFor(source: DateSource): keyof typeof MaterialCommunityIcons.glyphMap {
  if (source === 'ocr') return 'eye-check';
  if (source === 'manual') return 'pencil';
  return 'clock-outline';
}

function badgeIconColorFor(source: DateSource) {
  if (source === 'ocr') return '#92400E';
  if (source === 'manual') return palette.primaryDark;
  return palette.onSurfaceVariant;
}

function badgeTextFor(source: DateSource): string {
  if (source === 'ocr') return 'Read from document';
  if (source === 'manual') return 'Set by you';
  return "Today's date";
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 2,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  labelText: {
    color: palette.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  dateBig: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.onSurface,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
