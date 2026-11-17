'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteDocument, listDocuments } from '@/lib/api';
import type { StudyDocument } from '@/lib/types';

const POLL_MS = 4000;

/** Loads the student's documents and keeps polling while any file is still being indexed. */
export function useDocuments(userId: string | null) {
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const id = ++requestId.current;
    try {
      const docs = await listDocuments(userId);
      if (id !== requestId.current) return; // a newer request or user switch superseded this one
      setDocuments(docs);
      setError(null);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : 'Could not load documents.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [userId]);

  // Reset + initial load whenever the active student changes.
  useEffect(() => {
    setDocuments([]);
    setError(null);
    if (!userId) return;
    setLoading(true);
    void refresh();
    return () => {
      requestId.current++; // invalidate in-flight requests
    };
  }, [userId, refresh]);

  const hasPending = documents.some((d) => d.status !== 'READY' && d.status !== 'FAILED');
  useEffect(() => {
    if (!hasPending) return;
    const t = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [hasPending, refresh]);

  const remove = useCallback(
    async (fileName: string) => {
      if (!userId) return;
      await deleteDocument(userId, fileName);
      setDocuments((prev) => prev.filter((d) => d.fileName !== fileName));
      void refresh();
    },
    [userId, refresh],
  );

  return { documents, loading, error, refresh, remove };
}
