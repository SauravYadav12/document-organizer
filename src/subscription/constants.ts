/**
 * Product identifiers must match what is configured in App Store Connect.
 * Keep these in sync with the subscription group "DocOrg Pro" on both the
 * App Store Connect side and sandbox testing setup.
 */
export const SUBSCRIPTION_SKUS = {
  monthly: 'com.docorg.app.pro.monthly',
  yearly: 'com.docorg.app.pro.yearly',
} as const;

export const ALL_SUBSCRIPTION_SKUS: string[] = [
  SUBSCRIPTION_SKUS.monthly,
  SUBSCRIPTION_SKUS.yearly,
];

export type SubscriptionSku = (typeof SUBSCRIPTION_SKUS)[keyof typeof SUBSCRIPTION_SKUS];

/**
 * Required URLs for Apple App Store Review. These are placeholders — swap in
 * the real URLs before the first TestFlight submission. The paywall and
 * Settings screen link to these.
 */
export const LEGAL_URLS = {
  terms: 'https://docorg.app/terms',
  privacy: 'https://docorg.app/privacy',
  support: 'https://docorg.app/support',
} as const;

/** AsyncStorage key for the last-known entitlement snapshot. */
export const ENTITLEMENT_CACHE_KEY = 'docorg.entitlement.v1';

/**
 * How long to trust the cached entitlement before forcing a fresh StoreKit
 * fetch on app foreground. Short enough that a cancelled subscription is
 * reflected within a day, long enough that offline launches still work.
 */
export const ENTITLEMENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
