import type { SubscriptionSku } from './constants';

/**
 * Coarse-grained state the rest of the app cares about. The product details
 * (which SKU, when it expires, whether we're in a trial) live in the store
 * for screens that need them, but entitlement gates only need `isEntitled`.
 */
export type EntitlementStatus =
  | 'unknown'            // we haven't checked StoreKit yet this session
  | 'active'             // paid subscriber, full access
  | 'inTrial'            // free trial still running, full access
  | 'inBillingRetry'     // Apple is retrying the user's card — treat as NOT entitled per product decision
  | 'expired'            // trial finished and no subscription, or subscription ended
  | 'revoked'            // Apple refunded or revoked the subscription
  | 'neverSubscribed';   // brand new user who hasn't started a trial yet

export type EntitlementSnapshot = {
  status: EntitlementStatus;
  /** Which product the user is on, if any. */
  activeSku: SubscriptionSku | null;
  /** ISO string of when the current period ends (trial end or renewal date). */
  expiresAtIso: string | null;
  /** Whether the subscription will auto-renew at `expiresAtIso`. */
  willAutoRenew: boolean;
  /** When this snapshot was taken (millis). Used for cache TTL. */
  fetchedAtMs: number;
};

/**
 * Metadata about a single product, as reported by StoreKit at runtime.
 * Prices come back pre-localized to the user's storefront.
 */
export type SubscriptionProduct = {
  sku: SubscriptionSku;
  localizedPrice: string;    // e.g. "₹899.00" or "$9.99"
  periodLabel: 'month' | 'year';
  /** Raw product object from react-native-iap; carries introductory offer info. */
  raw: unknown;
  /** Is there a free introductory trial on this product? */
  hasIntroductoryTrial: boolean;
  introductoryTrialLabel: string | null; // e.g. "1 month free"
};

export function isEntitled(status: EntitlementStatus): boolean {
  return status === 'active' || status === 'inTrial';
}
