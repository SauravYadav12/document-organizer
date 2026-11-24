import {
  endConnection,
  finishTransaction,
  getAvailablePurchases,
  getSubscriptions,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestSubscription,
  setup,
  deepLinkToSubscriptions,
  IapIos,
  type SubscriptionIOS,
  type SubscriptionPurchase,
} from 'react-native-iap';
import { Platform } from 'react-native';

import { ALL_SUBSCRIPTION_SKUS, SUBSCRIPTION_SKUS, type SubscriptionSku } from './constants';
import type { EntitlementSnapshot, SubscriptionProduct } from './types';

type PurchaseEventHandler = (purchase: SubscriptionPurchase) => void;
type PurchaseErrorHandler = (error: unknown) => void;

let isConnected = false;
let purchaseSub: { remove: () => void } | null = null;
let errorSub: { remove: () => void } | null = null;

/**
 * Open the StoreKit connection in StoreKit 2 mode. Must be called once on
 * app launch before any other subscription operation. Idempotent.
 */
export async function connectSubscriptionService(handlers: {
  onPurchase: PurchaseEventHandler;
  onError: PurchaseErrorHandler;
}): Promise<void> {
  if (isConnected) return;
  if (Platform.OS !== 'ios') {
    // Android is out of scope for Phase 1. Leave the service inert so the
    // rest of the app can still call `getEntitlement()` and get a safe
    // default.
    isConnected = true;
    return;
  }
  await setup({ storekitMode: 'STOREKIT2_MODE' });
  await initConnection();
  purchaseSub = purchaseUpdatedListener((purchase) => {
    handlers.onPurchase(purchase as SubscriptionPurchase);
  });
  errorSub = purchaseErrorListener((error) => {
    handlers.onError(error);
  });
  isConnected = true;
}

export async function disconnectSubscriptionService(): Promise<void> {
  purchaseSub?.remove();
  errorSub?.remove();
  purchaseSub = null;
  errorSub = null;
  if (isConnected && Platform.OS === 'ios') {
    await endConnection();
  }
  isConnected = false;
}

/**
 * Load product metadata from App Store for every SKU in our group. Prices
 * come back pre-localized to the user's storefront. Returns an empty array
 * when StoreKit hasn't finished setting up or when running on Android.
 */
export async function fetchSubscriptionProducts(): Promise<SubscriptionProduct[]> {
  if (Platform.OS !== 'ios') return [];
  const raw = await getSubscriptions({ skus: ALL_SUBSCRIPTION_SKUS });
  return raw.map(toSubscriptionProduct).filter((p): p is SubscriptionProduct => p !== null);
}

/**
 * Query StoreKit for the user's current entitlements. StoreKit 2 returns
 * only cryptographically-verified transactions that are still valid, so an
 * empty result means the user is not entitled.
 */
export async function fetchCurrentEntitlement(): Promise<EntitlementSnapshot> {
  if (Platform.OS !== 'ios') {
    return {
      status: 'neverSubscribed',
      activeSku: null,
      expiresAtIso: null,
      willAutoRenew: false,
      fetchedAtMs: Date.now(),
    };
  }
  const purchases = await getAvailablePurchases();
  const activeNow = Date.now();
  // Pick the most-recent subscription purchase whose expiration is still in
  // the future. Per our policy, a subscription past its expiration is NOT
  // entitled even if Apple is in the billing-retry grace window.
  const activeSubs = purchases
    .filter((p) => isOurSku(p.productId))
    .filter((p) => extractExpirationMs(p) !== null && extractExpirationMs(p)! > activeNow)
    .sort((a, b) => (extractExpirationMs(b) ?? 0) - (extractExpirationMs(a) ?? 0));

  const active = activeSubs[0];
  if (!active) {
    // Are there any expired subs? If so → expired; otherwise → never subscribed.
    const everHad = purchases.some((p) => isOurSku(p.productId));
    if (everHad) {
      const expiredLatest = purchases
        .filter((p) => isOurSku(p.productId))
        .sort((a, b) => (extractExpirationMs(b) ?? 0) - (extractExpirationMs(a) ?? 0))[0];
      return {
        status: inferExpiredOrBillingRetry(expiredLatest),
        activeSku: null,
        expiresAtIso: extractExpirationIso(expiredLatest),
        willAutoRenew: false,
        fetchedAtMs: Date.now(),
      };
    }
    return {
      status: 'neverSubscribed',
      activeSku: null,
      expiresAtIso: null,
      willAutoRenew: false,
      fetchedAtMs: Date.now(),
    };
  }

  const inTrial = Boolean((active as SubscriptionPurchaseIOS).isTrialPeriodIOS);
  return {
    status: inTrial ? 'inTrial' : 'active',
    activeSku: active.productId as SubscriptionSku,
    expiresAtIso: extractExpirationIso(active),
    willAutoRenew: (active as SubscriptionPurchaseIOS).autoRenewingAndroid ?? true,
    fetchedAtMs: Date.now(),
  };
}

/**
 * Trigger Apple's purchase sheet for the given SKU. StoreKit shows its own
 * UI (trial disclosure, Face ID / passcode, etc.). The result comes back on
 * the purchaseUpdatedListener wired in connectSubscriptionService; this
 * promise resolves when Apple's sheet closes, not when the receipt arrives.
 */
export async function startPurchase(sku: SubscriptionSku): Promise<void> {
  if (Platform.OS !== 'ios') return;
  await requestSubscription({ sku });
}

export async function acknowledgePurchase(purchase: SubscriptionPurchase): Promise<void> {
  try {
    await finishTransaction({ purchase, isConsumable: false });
  } catch {
    // Non-fatal: Apple will re-deliver on next launch.
  }
}

/**
 * Restore any prior subscriptions this Apple ID owns. On iOS 15+ StoreKit 2
 * returns the same set the entitlement fetch uses — this is mostly a UX
 * affordance for a user switching devices.
 */
export async function restorePurchases(): Promise<EntitlementSnapshot> {
  return fetchCurrentEntitlement();
}

/**
 * Open the iOS Settings pane where the user can cancel, change plan, or
 * update their payment method. Called from the Settings screen and from the
 * billing-retry banner.
 */
export async function openManageSubscriptions(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  await deepLinkToSubscriptions({ sku: SUBSCRIPTION_SKUS.monthly });
}

/**
 * Present the system "Redeem Code" sheet so the user can enter a promo code
 * or an offer code. Apple handles the whole flow; we just get notified of
 * the resulting purchase via the purchase listener.
 */
export async function presentCodeRedemption(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  await IapIos.presentCodeRedemptionSheetIOS();
}

// ---------- helpers ----------

type SubscriptionPurchaseIOS = SubscriptionPurchase & {
  expirationDateIOS?: string | number;
  isTrialPeriodIOS?: boolean;
  autoRenewingAndroid?: boolean;
};

function isOurSku(sku: string): boolean {
  return ALL_SUBSCRIPTION_SKUS.includes(sku);
}

function extractExpirationMs(purchase: SubscriptionPurchase | undefined): number | null {
  if (!purchase) return null;
  const raw = (purchase as SubscriptionPurchaseIOS).expirationDateIOS;
  if (raw == null) return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function extractExpirationIso(purchase: SubscriptionPurchase | undefined): string | null {
  const ms = extractExpirationMs(purchase);
  return ms ? new Date(ms).toISOString() : null;
}

/**
 * If the expiration is in the past but the transaction still shows up as a
 * historical purchase, Apple may be in billing retry. We surface that as a
 * distinct state so the banner copy can say "Update payment method" instead
 * of "Resubscribe". Beyond a week past expiration we treat it as fully
 * expired — Apple's grace is at most 16 days but most are shorter.
 */
function inferExpiredOrBillingRetry(purchase: SubscriptionPurchase | undefined) {
  const expMs = extractExpirationMs(purchase);
  if (!expMs) return 'expired' as const;
  const daysPast = (Date.now() - expMs) / (24 * 60 * 60 * 1000);
  if (daysPast < 16) return 'inBillingRetry' as const;
  return 'expired' as const;
}

function toSubscriptionProduct(raw: unknown): SubscriptionProduct | null {
  const sub = raw as SubscriptionIOS | undefined;
  if (!sub || !sub.productId) return null;
  const sku = sub.productId as SubscriptionSku;
  const periodLabel = sub.subscriptionPeriodUnitIOS === 'YEAR' ? 'year' : 'month';
  const intro = (sub as { introductoryPrice?: string }).introductoryPrice;
  const introLabel = (sub as { introductoryPriceSubscriptionPeriodIOS?: string })
    .introductoryPriceSubscriptionPeriodIOS;
  const hasTrial = intro === '0' || intro === '0.00' || intro === '' || Boolean(introLabel);
  return {
    sku,
    localizedPrice: sub.localizedPrice ?? '',
    periodLabel,
    raw: sub,
    hasIntroductoryTrial: Boolean(hasTrial),
    introductoryTrialLabel: hasTrial ? '1 month free' : null,
  };
}
