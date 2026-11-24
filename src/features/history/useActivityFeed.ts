import { useEffect, useState } from 'react';
import { listRecentActivity } from '../../db/activityRepository';
import { useLibraryStore } from '../../stores/libraryStore';
import type { ActivityRecord } from '../../types/models';

export function useActivityFeed() {
  const version = useLibraryStore((s) => s.version);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const rows = await listRecentActivity(200);
      if (!cancelled) {
        setActivities(rows);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { activities, isLoading };
}
