import React, { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { PaywallScreen } from './PaywallScreen';
import { useSubscriptionStore } from './subscriptionStore';

/**
 * Top-level mount for the subscription lifecycle: opens the StoreKit
 * connection on first render, re-checks entitlement whenever the app
 * foregrounds, and hosts the paywall overlay.
 *
 * The paywall is never force-opened here — the user always has read-only
 * access to their own library even when unentitled. The paywall opens only
 * when the user taps a paid feature (via `useEntitlement().requireEntitlement()`)
 * or taps "See plans / Resubscribe" on the subscription banner.
 */
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const initialize = useSubscriptionStore((s) => s.initialize);
  const shutdown = useSubscriptionStore((s) => s.shutdown);
  const refreshIfStale = useSubscriptionStore((s) => s.refreshIfStale);

  useEffect(() => {
    initialize();
    return () => {
      shutdown();
    };
    // initialize / shutdown are stable Zustand actions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        refreshIfStale();
      }
    });
    return () => sub.remove();
  }, [refreshIfStale]);

  return (
    <>
      {children}
      <PaywallScreen />
    </>
  );
}
