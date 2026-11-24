import { useEffect, useState } from 'react';
import { listDocumentsForFolder, listMonthsForYear, listYears } from '../../db/documentsRepository';
import { useLibraryStore } from '../../stores/libraryStore';
import type { DocumentRecord, MonthSummary, YearSummary } from '../../types/models';

export function useYearList() {
  const version = useLibraryStore((s) => s.version);
  const [years, setYears] = useState<YearSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const rows = await listYears();
      if (!cancelled) {
        setYears(rows);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { years, isLoading };
}

export function useMonthList(year: number) {
  const version = useLibraryStore((s) => s.version);
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const rows = await listMonthsForYear(year);
      if (!cancelled) {
        setMonths(rows);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year, version]);

  return { months, isLoading };
}

export function useFolderDocuments(year: number, month: number) {
  const version = useLibraryStore((s) => s.version);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const rows = await listDocumentsForFolder(year, month, 200);
      if (!cancelled) {
        setDocuments(rows);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [year, month, version]);

  return { documents, isLoading };
}
