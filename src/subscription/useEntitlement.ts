import { useCallback } from 'react';

import { selectIsEntitled, useSubscriptionStore } from './subscriptionStore';
import { isEntitled } from './types';

/**
 * Consumer-facing hook for gating paid features.
 *
 * `isEntitled` is the primary signal. `requireEntitlement()` returns true
 * when the user can proceed; if they can't, it opens the paywall in soft
 * (dismissible) mode and returns false. Call it at the top of a handler
 * for a paid feature and bail early when it returns false.
 *
 *   const { requireEntitlement } = useEntitlement();
 *   function onSharePdf() {
 *     if (!requireEntitlement()) return;
 *     // ...proceed...
 *   }
 */
export function useEntitlement() {
  const status = useSubscriptionStore((s) => s.entitlement.status);
  const entitled = useSubscriptionStore(selectIsEntitled);
  const openPaywall = useSubscriptionStore((s) => s.openPaywall);

  const requireEntitlement = useCallback(() => {
    if (isEntitled(status)) return true;
    openPaywall('soft');
    return false;
  }, [status, openPaywall]);

  return {
    isEntitled: entitled,
    status,
    requireEntitlement,
    openPaywall: () => openPaywall('soft'),
  };
}
