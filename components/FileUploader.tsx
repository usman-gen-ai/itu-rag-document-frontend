'use client';

import { AlertCircle, CheckCircle2, Loader2, UploadCloud, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getUploadUrl, uploadToS3 } from '@/lib/api';
import type { StudyDocument } from '@/lib/types';
import { ALLOWED_EXTENSIONS, MAX_FILE_BYTES, cn, fileExt, formatBytes, uid } from '@/lib/utils';

type Phase = 'uploading' | 'syncing' | 'ready' | 'error';

interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  phase: Phase;
  /** Name after server-side sanitising; used to match the document list. */
  serverName?: string;
  error?: string;
}

interface Props {
  userId: string;
  documents: StudyDocument[];
  onUploaded: () => void;
}

const CONCURRENCY = 3;

const PHASE_LABEL: Record<Phase, string> = {
  uploading: 'Uploading...',
  syncing: 'Syncing Vectors...',
  ready: 'Ready',
  error: 'Failed',
};

const PHASE_STYLE: Record<Phase, string> = {
  uploading: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  syncing: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  ready: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  error: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

export function FileUploader({ userId, documents, onUploaded }: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const files = useRef(new Map<string, File>());

  const patch = useCallback((id: string, p: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  const processFile = useCallback(
    async (id: string) => {
      const file = files.current.get(id);
      if (!file) return;
      try {
        const res = await getUploadUrl(userId, file.name, file.type);
        patch(id, { serverName: res.fileName });
        await uploadToS3(res.uploadUrl, file, res.requiredHeaders, (progress) => patch(id, { progress }));
        patch(id, { phase: 'syncing', progress: 100 });
        onUploaded(); // the file now appears in the list; polling tracks indexing
      } catch (e) {
        patch(id, { phase: 'error', error: e instanceof Error ? e.message : 'Upload failed.' });
      } finally {
        files.current.delete(id);
      }
    },
    [userId, patch, onUploaded],
  );

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const incoming = Array.from(list);
      const queue: string[] = [];
      const newItems: UploadItem[] = incoming.map((file) => {
        const id = uid();
        const ext = fileExt(file.name);
        let error: string | undefined;
        if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) error = 'Only PDF, DOCX and TXT files are supported.';
        else if (file.size === 0) error = 'This file is empty.';
        else if (file.size > MAX_FILE_BYTES) error = `File is larger than ${formatBytes(MAX_FILE_BYTES)}.`;
        if (!error) {
          files.current.set(id, file);
          queue.push(id);
        }
        return { id, name: file.name, size: file.size, progress: 0, phase: error ? 'error' : 'uploading', error };
      });
      if (newItems.length === 0) return;
      setItems((prev) => [...newItems, ...prev]);

      // Small worker pool so dozens of slides don't open dozens of connections.
      const worker = async () => {
        for (let id = queue.shift(); id !== undefined; id = queue.shift()) await processFile(id);
      };
      for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) void worker();
    },
    [processFile],
  );

  // Move "syncing" items to Ready/Failed as the polled document list reports their status.
  useEffect(() => {
    setItems((prev) => {
      let changed = false;
      const next = prev.map((it) => {
        if (it.phase !== 'syncing' || !it.serverName) return it;
        const doc = documents.find((d) => d.fileName === it.serverName);
        if (doc?.status === 'READY') {
          changed = true;
          return { ...it, phase: 'ready' as const };
        }
        if (doc?.status === 'FAILED') {
          changed = true;
          return { ...it, phase: 'error' as const, error: doc.statusReason || 'Indexing failed.' };
        }
        return it;
      });
      return changed ? next : prev;
    });
  }, [documents]);

  // Auto-dismiss finished items.
  const hasReady = items.some((i) => i.phase === 'ready');
  useEffect(() => {
    if (!hasReady) return;
    const t = setTimeout(() => setItems((prev) => prev.filter((i) => i.phase !== 'ready')), 4000);
    return () => clearTimeout(t);
  }, [hasReady, items]);

  return (
    <div>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current++;
          setDragging(true);
        }}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), inputRef.current?.click())}
        role="button"
        tabIndex={0}
        aria-label="Upload study material"
        className={cn(
          'group cursor-pointer rounded-2xl border-2 border-dashed px-4 py-6 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          dragging
            ? 'scale-[1.02] border-brand-500 bg-brand-500/10'
            : 'border-slate-300 bg-white/40 hover:border-brand-400 hover:bg-brand-500/5 dark:border-white/15 dark:bg-white/[0.03]',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = ''; // allow re-selecting the same file
          }}
        />
        <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-600 transition group-hover:scale-110 dark:text-brand-300">
          <UploadCloud size={22} />
        </div>
        <p className="text-sm font-semibold">{dragging ? 'Drop to upload' : 'Drop files or click to browse'}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">PDF, DOCX, TXT · multiple files · up to {formatBytes(MAX_FILE_BYTES)} each</p>
      </div>

      {items.length > 0 && (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {items.map((it) => (
            <li key={it.id} className="glass animate-fade-up rounded-xl p-2.5">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-xs font-semibold" title={it.name}>{it.name}</p>
                <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', PHASE_STYLE[it.phase])}>
                  {it.phase === 'ready' ? <CheckCircle2 size={11} /> : it.phase === 'error' ? <AlertCircle size={11} /> : <Loader2 size={11} className="animate-spin" />}
                  {PHASE_LABEL[it.phase]}
                </span>
                {(it.phase === 'error' || it.phase === 'ready') && (
                  <button
                    onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                    aria-label={`Dismiss ${it.name}`}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {it.phase === 'error' ? (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-300">{it.error}</p>
              ) : (
                <div
                  className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
                  role="progressbar"
                  aria-valuenow={it.phase === 'uploading' ? it.progress : 100}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {it.phase === 'syncing' ? (
                    <div className="absolute inset-y-0 left-0 w-1/3 animate-indeterminate rounded-full bg-amber-500" />
                  ) : (
                    <div
                      className={cn('h-full rounded-full transition-all duration-200', it.phase === 'ready' ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-sky-500')}
                      style={{ width: `${it.phase === 'ready' ? 100 : it.progress}%` }}
                    />
                  )}
                </div>
              )}
              {it.phase === 'uploading' && (
                <p className="mt-1 text-[10px] text-slate-400">{it.progress}% · {formatBytes(it.size)}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
