import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { ENTITLEMENT_CACHE_KEY, ENTITLEMENT_CACHE_TTL_MS } from './constants';
import {
  acknowledgePurchase,
  connectSubscriptionService,
  disconnectSubscriptionService,
  fetchCurrentEntitlement,
  fetchSubscriptionProducts,
  openManageSubscriptions,
  presentCodeRedemption,
  restorePurchases,
  startPurchase,
} from './subscriptionService';
import { isEntitled, type EntitlementSnapshot, type SubscriptionProduct } from './types';
import type { SubscriptionSku } from './constants';

type SubscriptionStoreState = {
  entitlement: EntitlementSnapshot;
  products: SubscriptionProduct[];
  /** True while an initial StoreKit fetch is in flight (first launch). */
  isHydrating: boolean;
  /** True while a purchase or restore is in flight (don't let user tap twice). */
  isBusy: boolean;
  /** Short-lived user-visible error (from last purchase/restore attempt). */
  lastError: string | null;

  // ---- lifecycle ----
  /** Call once from the top of the app. Loads cached entitlement, opens StoreKit, refreshes. */
  initialize: () => Promise<void>;
  /** Call on app foreground to re-check entitlement if the cache is stale. */
  refreshIfStale: () => Promise<void>;
  /** Tear down on unmount. */
  shutdown: () => Promise<void>;

  // ---- paywall presentation ----
  /** True when the Paywall overlay is currently shown. */
  isPaywallOpen: boolean;
  /** "forced" paywalls hide their close button (user is not entitled yet). */
  paywallMode: 'forced' | 'soft';
  openPaywall: (mode: 'forced' | 'soft') => void;
  closePaywall: () => void;

  // ---- user actions ----
  purchase: (sku: SubscriptionSku) => Promise<void>;
  restore: () => Promise<void>;
  redeemCode: () => Promise<void>;
  openManage: () => Promise<void>;
  clearError: () => void;
};

const INITIAL_SNAPSHOT: EntitlementSnapshot = {
  status: 'unknown',
  activeSku: null,
  expiresAtIso: null,
  willAutoRenew: false,
  fetchedAtMs: 0,
};

export const useSubscriptionStore = create<SubscriptionStoreState>((set, get) => ({
  entitlement: INITIAL_SNAPSHOT,
  products: [],
  isHydrating: true,
  isBusy: false,
  lastError: null,
  isPaywallOpen: false,
  paywallMode: 'soft',

  openPaywall(mode) {
    set({ isPaywallOpen: true, paywallMode: mode, lastError: null });
  },
  closePaywall() {
    set({ isPaywallOpen: false, lastError: null });
  },

  async initialize() {
    const cached = await readCachedSnapshot();
    if (cached) set({ entitlement: cached });

    await connectSubscriptionService({
      onPurchase: async (purchase) => {
        await acknowledgePurchase(purchase);
        const fresh = await fetchCurrentEntitlement();
        const nowEntitled = isEntitled(fresh.status);
        set((prev) => ({
          entitlement: fresh,
          isBusy: false,
          lastError: null,
          // Successful purchase or restore closes the paywall automatically.
          isPaywallOpen: nowEntitled ? false : prev.isPaywallOpen,
        }));
        await writeCachedSnapshot(fresh);
      },
      onError: (error) => {
        set({
          isBusy: false,
          lastError: formatPurchaseError(error),
        });
      },
    });

    try {
      const [fresh, products] = await Promise.all([
        fetchCurrentEntitlement(),
        fetchSubscriptionProducts(),
      ]);
      set({ entitlement: fresh, products, isHydrating: false });
      await writeCachedSnapshot(fresh);
    } catch {
      // Keep whatever cached entitlement we have; show products as empty.
      set({ isHydrating: false });
    }
  },

  async refreshIfStale() {
    const { entitlement } = get();
    const age = Date.now() - entitlement.fetchedAtMs;
    if (age < ENTITLEMENT_CACHE_TTL_MS) return;
    try {
      const fresh = await fetchCurrentEntitlement();
      set({ entitlement: fresh });
      await writeCachedSnapshot(fresh);
    } catch {
      // Keep the cached entitlement rather than risking a false-negative.
    }
  },

  async shutdown() {
    await disconnectSubscriptionService();
  },

  async purchase(sku) {
    if (get().isBusy) return;
    set({ isBusy: true, lastError: null });
    try {
      await startPurchase(sku);
      // Resolution lands on the purchaseUpdatedListener, which flips isBusy
      // back off once the receipt arrives and is verified.
    } catch (err) {
      set({ isBusy: false, lastError: formatPurchaseError(err) });
    }
  },

  async restore() {
    if (get().isBusy) return;
    set({ isBusy: true, lastError: null });
    try {
      const fresh = await restorePurchases();
      set({ entitlement: fresh, isBusy: false });
      await writeCachedSnapshot(fresh);
    } catch (err) {
      set({ isBusy: false, lastError: formatPurchaseError(err) });
    }
  },

  async openManage() {
    try {
      await openManageSubscriptions();
    } catch {
      // Deep link failure is non-fatal.
    }
  },

  async redeemCode() {
    try {
      await presentCodeRedemption();
    } catch (err) {
      set({ lastError: formatPurchaseError(err) });
    }
  },

  clearError() {
    set({ lastError: null });
  },
}));

// ---------- selectors / utilities ----------

/**
 * Convenience selector: the single boolean the rest of the app usually
 * cares about. Treats "unknown" (pre-hydration) as entitled OPTIMISTICALLY
 * so the first-frame render doesn't flash a paywall at a paying user. The
 * real state lands within ~500ms and corrects any wrong assumption.
 */
export function selectIsEntitled(state: SubscriptionStoreState): boolean {
  if (state.entitlement.status === 'unknown') return true;
  return isEntitled(state.entitlement.status);
}

export function selectNeedsPaywall(state: SubscriptionStoreState): boolean {
  const s = state.entitlement.status;
  return s === 'expired' || s === 'inBillingRetry' || s === 'neverSubscribed' || s === 'revoked';
}

// ---------- cache ----------

async function readCachedSnapshot(): Promise<EntitlementSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(ENTITLEMENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EntitlementSnapshot;
    if (typeof parsed.status !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCachedSnapshot(snapshot: EntitlementSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(ENTITLEMENT_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Best-effort cache; losing it just forces a fresh fetch next launch.
  }
}

function formatPurchaseError(err: unknown): string {
  if (!err) return 'Something went wrong. Try again.';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null) {
    const asRecord = err as { code?: string; message?: string };
    if (asRecord.code === 'E_USER_CANCELLED') return '';
    if (asRecord.message) return asRecord.message;
  }
  return 'Something went wrong. Try again.';
}
