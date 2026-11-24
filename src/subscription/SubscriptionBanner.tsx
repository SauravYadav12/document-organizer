import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { palette, radii, spacing } from '../ui/theme';
import { useSubscriptionStore } from './subscriptionStore';

/**
 * Persistent banner shown at the top of the Library when the user is in a
 * state that needs their attention. Render it inside each screen that wants
 * to surface it — the banner hides itself when the state is healthy.
 */
export function SubscriptionBanner() {
  const status = useSubscriptionStore((s) => s.entitlement.status);
  const openPaywall = useSubscriptionStore((s) => s.openPaywall);
  const openManage = useSubscriptionStore((s) => s.openManage);

  if (status === 'active' || status === 'inTrial' || status === 'unknown') {
    return null;
  }
  if (status === 'neverSubscribed') {
    // Brand new user — nothing has gone wrong, no banner. The paywall opens
    // naturally when they tap a paid feature.
    return null;
  }

  const config =
    status === 'inBillingRetry'
      ? {
          icon: 'credit-card-off-outline' as const,
          title: 'Payment issue',
          body: 'We could not charge your payment method. Update it to keep DocOrg Pro active.',
          cta: 'Update',
          onPress: () => openManage(),
          tone: 'warning' as const,
        }
      : {
          icon: 'lock-outline' as const,
          title: 'DocOrg Pro ended',
          body: 'Capture, PDF export, and ZIP export are paused. Your library and history stay here.',
          cta: 'Resubscribe',
          onPress: () => openPaywall('soft'),
          tone: 'neutral' as const,
        };

  const toneStyle = config.tone === 'warning' ? styles.warning : styles.neutral;

  return (
    <View style={[styles.container, toneStyle]}>
      <MaterialCommunityIcons
        name={config.icon}
        size={22}
        color={config.tone === 'warning' ? '#92400E' : palette.primaryDark}
      />
      <View style={styles.text}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.body}>{config.body}</Text>
      </View>
      <Pressable onPress={config.onPress} hitSlop={8} style={styles.cta}>
        <Text style={styles.ctaLabel}>{config.cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    margin: spacing.sm,
    borderRadius: radii.md,
  },
  warning: { backgroundColor: palette.accentContainer },
  neutral: { backgroundColor: palette.primaryContainer },
  text: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: palette.onSurface },
  body: { fontSize: 11, color: palette.onSurfaceVariant, marginTop: 2, lineHeight: 15 },
  cta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: palette.white,
  },
  ctaLabel: { fontSize: 12, fontWeight: '700', color: palette.primary },
});
