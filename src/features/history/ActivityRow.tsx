import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from '../../ui/PressableScale';
import { palette, radii, spacing } from '../../ui/theme';
import type { ActivityRecord } from '../../types/models';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type Props = {
  activity: ActivityRecord;
  onPress: () => void;
};

function ActivityRowBase({ activity, onPress }: Props) {
  const visual = visualsFor(activity.activityType);
  const title = formatTitle(activity);
  return (
    <PressableScale onPress={onPress} style={styles.row} haptic={false}>
      <View style={[styles.iconWrap, { backgroundColor: visual.bg }]}>
        <MaterialCommunityIcons name={visual.icon} size={20} color={visual.fg} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.timestamp}>{formatRelative(activity.timestamp)}</Text>
      </View>
    </PressableScale>
  );
}

export const ActivityRow = memo(ActivityRowBase);

function visualsFor(type: ActivityRecord['activityType']) {
  switch (type) {
    case 'created':
      return { icon: 'plus-circle' as const, bg: palette.primaryContainer, fg: palette.primaryDark };
    case 'moved':
      return { icon: 'arrow-right-bold' as const, bg: palette.accentContainer, fg: '#92400E' };
    case 'deleted':
      return { icon: 'trash-can' as const, bg: '#FEE2E2', fg: palette.error };
    case 'exported':
      return { icon: 'file-pdf-box' as const, bg: '#DBEAFE', fg: '#1D4ED8' };
    case 'shared':
      return { icon: 'share-variant' as const, bg: '#E0E7FF', fg: '#4338CA' };
  }
}

function formatTitle(a: ActivityRecord): string {
  const subject = a.documentTitle ? `"${a.documentTitle}"` : 'a document';
  if (a.activityType === 'created' && a.toYear && a.toMonth) {
    return `Created ${subject} in ${folderLabel(a.toYear, a.toMonth)}`;
  }
  if (a.activityType === 'moved' && a.fromYear && a.toYear) {
    return `Moved ${subject} from ${folderLabel(a.fromYear, a.fromMonth!)} → ${folderLabel(a.toYear, a.toMonth!)}`;
  }
  if (a.activityType === 'deleted') {
    return `Deleted ${subject}${a.fromYear ? ` from ${folderLabel(a.fromYear, a.fromMonth!)}` : ''}`;
  }
  if (a.activityType === 'exported') {
    return `Exported ${a.documentTitle ?? 'documents'} as PDF`;
  }
  if (a.activityType === 'shared') {
    return `Shared ${a.documentTitle ?? 'documents'}`;
  }
  return 'Activity';
}

function folderLabel(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < 60_000) return 'just now';
  if (diffMs < 60 * 60_000) return `${Math.floor(diffMs / 60_000)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / (60 * 60_000))} h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} d ago`;
  return new Date(iso).toLocaleDateString();
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.white,
    borderRadius: radii.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    gap: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '600', color: palette.onSurface },
  timestamp: { fontSize: 12, color: palette.onSurfaceVariant },
});
