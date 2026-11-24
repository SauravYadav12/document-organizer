import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, radii, spacing } from '../ui/theme';
import { LEGAL_URLS, SUBSCRIPTION_SKUS, type SubscriptionSku } from './constants';
import { useSubscriptionStore } from './subscriptionStore';
import type { SubscriptionProduct } from './types';

const FEATURE_BULLETS = [
  { icon: 'camera-plus', title: 'Capture new documents', detail: 'Scan any paper document straight into the right month.' },
  { icon: 'text-recognition', title: 'Auto date & title detection', detail: 'On-device OCR reads the date off the scan.' },
  { icon: 'file-pdf-box', title: 'Combined PDF export', detail: 'Select any set of scans and share one tidy PDF.' },
  { icon: 'folder-zip', title: 'Folder ZIP export', detail: 'Send every original from a month in one archive.' },
  { icon: 'printer', title: 'Print any document', detail: 'AirPrint or save to Files.' },
] as const;

export function PaywallScreen() {
  const isOpen = useSubscriptionStore((s) => s.isPaywallOpen);
  const mode = useSubscriptionStore((s) => s.paywallMode);
  const products = useSubscriptionStore((s) => s.products);
  const isBusy = useSubscriptionStore((s) => s.isBusy);
  const lastError = useSubscriptionStore((s) => s.lastError);
  const entitlement = useSubscriptionStore((s) => s.entitlement);
  const close = useSubscriptionStore((s) => s.closePaywall);
  const purchase = useSubscriptionStore((s) => s.purchase);
  const restore = useSubscriptionStore((s) => s.restore);
  const redeem = useSubscriptionStore((s) => s.redeemCode);
  const insets = useSafeAreaInsets();

  const monthly = findProduct(products, SUBSCRIPTION_SKUS.monthly);
  const yearly = findProduct(products, SUBSCRIPTION_SKUS.yearly);

  const neverSubscribed = entitlement.status === 'neverSubscribed' || entitlement.status === 'unknown';
  const hasTrialAvailable = neverSubscribed && Boolean(monthly?.hasIntroductoryTrial || yearly?.hasIntroductoryTrial);

  const [selectedSku, setSelectedSku] = useState<SubscriptionSku>(SUBSCRIPTION_SKUS.yearly);

  const yearlySavingsPct = useMemo(() => computeYearlySavingsPct(monthly, yearly), [monthly, yearly]);

  if (!isOpen) return null;

  const dismissible = mode === 'soft';
  const primaryCtaLabel = hasTrialAvailable
    ? 'Start 1-month free trial'
    : entitlement.status === 'inBillingRetry'
      ? 'Update payment method'
      : 'Resubscribe';

  async function onPrimaryCta() {
    if (entitlement.status === 'inBillingRetry') {
      await useSubscriptionStore.getState().openManage();
      return;
    }
    await purchase(selectedSku);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={dismissible ? close : undefined}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.lg }]}>
          {dismissible ? (
            <IconButton
              icon="close"
              onPress={close}
              style={styles.closeBtn}
              accessibilityLabel="Close"
            />
          ) : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>DocOrg Pro</Text>
              </View>
              <Text style={styles.heroTitle}>
                {entitlement.status === 'inBillingRetry'
                  ? 'Your payment needs a quick fix'
                  : neverSubscribed
                    ? 'Keep every document, every month'
                    : 'Welcome back. Resubscribe to carry on.'}
              </Text>
              <Text style={styles.heroSubtitle}>
                {entitlement.status === 'inBillingRetry'
                  ? "We couldn't charge your payment method. Update it in Settings to keep DocOrg Pro active."
                  : hasTrialAvailable
                    ? 'One month free, then pick monthly or yearly. Cancel anytime from Settings.'
                    : 'Your library and history stay here forever. Resubscribe to capture and export again.'}
              </Text>
            </View>

            {entitlement.status !== 'inBillingRetry' ? (
              <View style={styles.plans}>
                {monthly ? (
                  <PlanCard
                    product={monthly}
                    selected={selectedSku === SUBSCRIPTION_SKUS.monthly}
                    onPress={() => setSelectedSku(SUBSCRIPTION_SKUS.monthly)}
                    badge={null}
                    showTrial={hasTrialAvailable}
                  />
                ) : null}
                {yearly ? (
                  <PlanCard
                    product={yearly}
                    selected={selectedSku === SUBSCRIPTION_SKUS.yearly}
                    onPress={() => setSelectedSku(SUBSCRIPTION_SKUS.yearly)}
                    badge={yearlySavingsPct ? `Save ${yearlySavingsPct}%` : 'Best value'}
                    showTrial={hasTrialAvailable}
                  />
                ) : null}
                {!monthly && !yearly ? (
                  <View style={styles.loadingPlans}>
                    <ActivityIndicator color={palette.primary} />
                    <Text style={styles.loadingPlansText}>Loading plans…</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.features}>
              {FEATURE_BULLETS.map((feature) => (
                <View key={feature.title} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <MaterialCommunityIcons
                      name={feature.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                      size={20}
                      color={palette.primary}
                    />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDetail}>{feature.detail}</Text>
                  </View>
                </View>
              ))}
            </View>

            {lastError ? (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={palette.error} />
                <Text style={styles.errorText}>{lastError}</Text>
              </View>
            ) : null}

            <Button
              mode="contained"
              onPress={onPrimaryCta}
              loading={isBusy}
              disabled={isBusy || (entitlement.status !== 'inBillingRetry' && (!monthly && !yearly))}
              style={styles.primaryCta}
              contentStyle={styles.primaryCtaContent}
              labelStyle={styles.primaryCtaLabel}
            >
              {primaryCtaLabel}
            </Button>

            <Text style={styles.disclosure}>
              Payment will be charged to your Apple ID at confirmation of purchase. Subscription
              automatically renews unless canceled at least 24 hours before the end of the current
              period. Manage or cancel any time in Settings → Apple ID → Subscriptions.
            </Text>

            <View style={styles.secondaryRow}>
              <Pressable onPress={() => restore()} hitSlop={8}>
                <Text style={styles.secondaryLink}>Restore purchases</Text>
              </Pressable>
              <Text style={styles.secondarySep}>·</Text>
              <Pressable onPress={() => redeem()} hitSlop={8}>
                <Text style={styles.secondaryLink}>Redeem code</Text>
              </Pressable>
            </View>

            <View style={styles.legalRow}>
              <Pressable onPress={() => Linking.openURL(LEGAL_URLS.terms)} hitSlop={8}>
                <Text style={styles.legalLink}>Terms of Service</Text>
              </Pressable>
              <Text style={styles.secondarySep}>·</Text>
              <Pressable onPress={() => Linking.openURL(LEGAL_URLS.privacy)} hitSlop={8}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type PlanCardProps = {
  product: SubscriptionProduct;
  selected: boolean;
  onPress: () => void;
  badge: string | null;
  showTrial: boolean;
};

function PlanCard({ product, selected, onPress, badge, showTrial }: PlanCardProps) {
  const periodWord = product.periodLabel === 'year' ? 'yr' : 'mo';
  return (
    <Pressable
      onPress={onPress}
      style={[styles.planCard, selected ? styles.planCardSelected : null]}
    >
      {badge ? (
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <Text style={styles.planPeriod}>
        {product.periodLabel === 'year' ? 'Yearly' : 'Monthly'}
      </Text>
      <Text style={styles.planPrice}>
        {product.localizedPrice || '—'}
        <Text style={styles.planPeriodSuffix}> /{periodWord}</Text>
      </Text>
      {showTrial && product.hasIntroductoryTrial ? (
        <Text style={styles.planTrial}>1 month free trial</Text>
      ) : null}
    </Pressable>
  );
}

function findProduct(products: SubscriptionProduct[], sku: SubscriptionSku): SubscriptionProduct | undefined {
  return products.find((p) => p.sku === sku);
}

function computeYearlySavingsPct(
  monthly: SubscriptionProduct | undefined,
  yearly: SubscriptionProduct | undefined,
): number | null {
  if (!monthly || !yearly) return null;
  const monthlyPrice = parsePrice(monthly.localizedPrice);
  const yearlyPrice = parsePrice(yearly.localizedPrice);
  if (!monthlyPrice || !yearlyPrice) return null;
  const twelveMonth = monthlyPrice * 12;
  if (yearlyPrice >= twelveMonth) return null;
  return Math.round(((twelveMonth - yearlyPrice) / twelveMonth) * 100);
}

function parsePrice(priceStr: string): number | null {
  const numeric = priceStr.replace(/[^0-9.]/g, '');
  if (!numeric) return null;
  const n = Number(numeric);
  return Number.isFinite(n) ? n : null;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: palette.backdrop, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '95%',
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 4,
    zIndex: 10,
  },
  scroll: { },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  badge: {
    backgroundColor: palette.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeText: {
    color: palette.primaryDark,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.onSurface,
    textAlign: 'center',
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: 14,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  plans: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  planCard: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: palette.outline,
    padding: spacing.md,
    minHeight: 110,
    gap: 2,
    backgroundColor: palette.white,
  },
  planCardSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primaryContainer,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginBottom: 2,
  },
  planBadgeText: { color: palette.white, fontSize: 10, fontWeight: '700' },
  planPeriod: { fontSize: 13, color: palette.onSurfaceVariant, fontWeight: '500' },
  planPrice: { fontSize: 22, fontWeight: '700', color: palette.onSurface },
  planPeriodSuffix: { fontSize: 13, fontWeight: '500', color: palette.onSurfaceVariant },
  planTrial: { fontSize: 11, color: palette.primaryDark, fontWeight: '600', marginTop: 2 },
  loadingPlans: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  loadingPlansText: { color: palette.onSurfaceVariant, fontSize: 12 },
  features: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, gap: 2 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: palette.onSurface },
  featureDetail: { fontSize: 12, color: palette.onSurfaceVariant, lineHeight: 16 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  errorText: { flex: 1, color: palette.error, fontSize: 12 },
  primaryCta: { backgroundColor: palette.primary, borderRadius: radii.lg },
  primaryCtaContent: { height: 52 },
  primaryCtaLabel: { fontSize: 16, fontWeight: '700', color: palette.white },
  disclosure: {
    fontSize: 11,
    color: palette.onSurfaceVariant,
    lineHeight: 15,
    textAlign: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  secondaryLink: { color: palette.primary, fontWeight: '600', fontSize: 13 },
  secondarySep: { color: palette.onSurfaceVariant, fontSize: 13 },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legalLink: { color: palette.onSurfaceVariant, fontSize: 12, textDecorationLine: 'underline' },
});
