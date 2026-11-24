import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { palette, radii, spacing } from '../ui/theme';
import { LEGAL_URLS } from './constants';
import { useSubscriptionStore } from './subscriptionStore';

const PLAN_LABELS: Record<string, string> = {
  active: 'Active subscription',
  inTrial: 'Free trial',
  inBillingRetry: 'Payment issue',
  expired: 'Expired',
  revoked: 'Refunded',
  neverSubscribed: 'No active subscription',
  unknown: 'Checking…',
};

export function SettingsScreen() {
  const entitlement = useSubscriptionStore((s) => s.entitlement);
  const openPaywall = useSubscriptionStore((s) => s.openPaywall);
  const openManage = useSubscriptionStore((s) => s.openManage);
  const restore = useSubscriptionStore((s) => s.restore);
  const redeem = useSubscriptionStore((s) => s.redeemCode);
  const isBusy = useSubscriptionStore((s) => s.isBusy);

  const statusLabel = PLAN_LABELS[entitlement.status] ?? entitlement.status;
  const expiresLabel = entitlement.expiresAtIso ? formatDate(entitlement.expiresAtIso) : null;
  const canManage = entitlement.status === 'active' || entitlement.status === 'inTrial' || entitlement.status === 'inBillingRetry';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: statusDotColor(entitlement.status) }]} />
          <Text style={styles.statusLabel}>{statusLabel}</Text>
        </View>
        <Text style={styles.planName}>DocOrg Pro</Text>
        {expiresLabel ? (
          <Text style={styles.cardSub}>
            {entitlement.status === 'active' || entitlement.status === 'inTrial'
              ? `${entitlement.willAutoRenew ? 'Renews' : 'Ends'} on ${expiresLabel}`
              : `Ended on ${expiresLabel}`}
          </Text>
        ) : null}

        {canManage ? (
          <Pressable
            onPress={() => openManage()}
            style={({ pressed }) => [styles.primaryBtn, pressed ? styles.pressed : null]}
          >
            <Text style={styles.primaryBtnLabel}>Manage subscription</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => openPaywall('soft')}
            style={({ pressed }) => [styles.primaryBtn, pressed ? styles.pressed : null]}
          >
            <Text style={styles.primaryBtnLabel}>
              {entitlement.status === 'neverSubscribed' ? 'See plans' : 'Resubscribe'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.list}>
        <Row
          icon="refresh"
          label="Restore purchases"
          detail="Pick up a previous subscription on this Apple ID."
          onPress={() => restore()}
          disabled={isBusy}
        />
        <Row
          icon="ticket-percent-outline"
          label="Redeem code"
          detail="Promo or offer code from DocOrg."
          onPress={() => redeem()}
          disabled={isBusy}
        />
        <Row
          icon="shield-outline"
          label="Privacy Policy"
          onPress={() => Linking.openURL(LEGAL_URLS.privacy)}
        />
        <Row
          icon="file-document-outline"
          label="Terms of Service"
          onPress={() => Linking.openURL(LEGAL_URLS.terms)}
        />
        <Row
          icon="help-circle-outline"
          label="Support"
          onPress={() => Linking.openURL(LEGAL_URLS.support)}
        />
      </View>

      <Text style={styles.footer}>DocOrg · v1.0</Text>
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  detail,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  detail?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null, disabled ? styles.rowDisabled : null]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={palette.primary} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={palette.onSurfaceVariant} />
    </Pressable>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusDotColor(status: string): string {
  if (status === 'active' || status === 'inTrial') return palette.primary;
  if (status === 'inBillingRetry') return palette.accent;
  if (status === 'expired' || status === 'revoked') return palette.error;
  return palette.outline;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { color: palette.onSurfaceVariant, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  planName: { fontSize: 22, fontWeight: '700', color: palette.onSurface },
  cardSub: { fontSize: 13, color: palette.onSurfaceVariant },
  primaryBtn: {
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  primaryBtnLabel: { color: palette.white, fontWeight: '700', fontSize: 14 },
  list: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.outline,
  },
  rowPressed: { backgroundColor: palette.surfaceDim },
  rowDisabled: { opacity: 0.4 },
  rowText: { flex: 1 },
  rowLabel: { color: palette.onSurface, fontSize: 14, fontWeight: '600' },
  rowDetail: { color: palette.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  footer: { textAlign: 'center', color: palette.onSurfaceVariant, fontSize: 11 },
});
