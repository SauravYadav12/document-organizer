import { useCallback, useEffect, useRef, useState } from 'react';
import { listRecentActivity } from '../../db/activityRepository';
import { useLibraryStore } from '../../stores/libraryStore';
import type { ActivityRecord } from '../../types/models';

const PAGE_SIZE = 50;

export function useActivityFeed() {
  const version = useLibraryStore((s) => s.version);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const inFlight = useRef(false);

  const loadFirstPage = useCallback(async (silent: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      if (silent) setIsRefreshing(true);
      else setIsLoading(true);
      const rows = await listRecentActivity(PAGE_SIZE, 0);
      setActivities(rows);
      setHasMore(rows.length === PAGE_SIZE);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      inFlight.current = false;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !hasMore || isLoading) return;
    inFlight.current = true;
    setIsLoadingMore(true);
    try {
      const rows = await listRecentActivity(PAGE_SIZE, activities.length);
      setActivities((prev) => prev.concat(rows));
      setHasMore(rows.length === PAGE_SIZE);
    } finally {
      setIsLoadingMore(false);
      inFlight.current = false;
    }
  }, [activities.length, hasMore, isLoading]);

  // Reload page 1 whenever the library store bumps its version (capture / move / delete).
  useEffect(() => {
    loadFirstPage(false);
  }, [version, loadFirstPage]);

  const refresh = useCallback(() => loadFirstPage(true), [loadFirstPage]);

  return { activities, isLoading, isRefreshing, isLoadingMore, hasMore, refresh, loadMore };
}
