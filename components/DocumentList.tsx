'use client';

import { AlertCircle, Check, CheckCircle2, FileText, FileType2, Loader2, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DocStatus, StudyDocument } from '@/lib/types';
import { cn, fileExt, formatBytes } from '@/lib/utils';

interface Props {
  documents: StudyDocument[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDelete: (fileName: string) => Promise<void>;
  /** Files the chat searches in. Empty = all documents. */
  selected: string[];
  onToggle: (fileName: string) => void;
  onSelectAll: () => void;
}

function FileIcon({ name }: { name: string }) {
  const ext = fileExt(name);
  const style =
    ext === 'pdf'
      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
      : ext === 'docx'
        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
        : 'bg-slate-500/15 text-slate-600 dark:text-slate-300';
  const Icon = ext === 'docx' ? FileType2 : FileText;
  return (
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', style)}>
      <Icon size={17} />
    </span>
  );
}

function StatusBadge({ status, reason }: { status: DocStatus; reason?: string }) {
  if (status === 'READY')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
        <CheckCircle2 size={11} /> Ready
      </span>
    );
  if (status === 'FAILED')
    return (
      <span title={reason} className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-300">
        <AlertCircle size={11} /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-300">
      <Loader2 size={11} className="animate-spin" /> {status === 'QUEUED' ? 'Queued for sync' : 'Syncing Vectors...'}
    </span>
  );
}

export function DocumentList({ documents, loading, error, onRefresh, onDelete, selected, onToggle, onSelectAll }: Props) {
  const [query, setQuery] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? documents.filter((d) => d.fileName.toLowerCase().includes(q)) : documents;
  }, [documents, query]);

  const readyCount = documents.filter((d) => d.status === 'READY').length;
  const allSelected = selected.length === 0;
  const isChecked = (d: StudyDocument) => d.status === 'READY' && (allSelected || selected.includes(d.fileName));

  const handleDelete = async (name: string) => {
    setDeleting(name);
    setDeleteError(null);
    try {
      await onDelete(name);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete the file.');
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          My Study Material{documents.length > 0 && <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] dark:bg-white/10">{documents.length}</span>}
        </h2>
        <button onClick={onRefresh} className="text-slate-400 transition hover:text-brand-500" aria-label="Refresh list" title="Refresh">
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
        </button>
      </div>

      {readyCount > 1 && (
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{allSelected ? 'Chat searches all ready files' : `Chat searches ${selected.length} of ${readyCount} files`}</span>
          {!allSelected && (
            <button onClick={onSelectAll} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
              Select all
            </button>
          )}
        </div>
      )}

      {documents.length > 3 && (
        <div className="relative mb-2">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter files…"
            aria-label="Filter files"
            className="glass w-full rounded-lg py-1.5 pl-8 pr-2 text-xs outline-none placeholder:text-slate-400 focus:border-brand-400"
          />
        </div>
      )}

      {error && (
        <p className="mb-2 rounded-lg bg-rose-500/10 px-2.5 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">{error}</p>
      )}
      {deleteError && (
        <p className="mb-2 rounded-lg bg-rose-500/10 px-2.5 py-2 text-xs font-medium text-rose-700 dark:text-rose-300">{deleteError}</p>
      )}

      <ul className="-mr-1 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {loading && documents.length === 0 &&
          [0, 1, 2].map((i) => <li key={i} className="h-14 animate-pulse rounded-xl bg-slate-200/70 dark:bg-white/5" />)}

        {!loading && !error && documents.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
            No notes yet. Upload your first file to begin.
          </li>
        )}

        {documents.length > 0 && filtered.length === 0 && (
          <li className="px-3 py-4 text-center text-xs text-slate-500">No files match “{query}”.</li>
        )}

        {filtered.map((d) => (
          <li key={d.key} className="glass group flex items-center gap-2.5 rounded-xl p-2 transition hover:border-brand-400/50">
            <button
              type="button"
              role="checkbox"
              aria-checked={isChecked(d)}
              aria-label={`Include ${d.fileName} in chat search`}
              title={d.status === 'READY' ? 'Include in chat search' : 'Available once the file is Ready'}
              disabled={d.status !== 'READY'}
              onClick={() => onToggle(d.fileName)}
              className={cn(
                'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-40',
                isChecked(d)
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-slate-300 bg-white/60 text-transparent hover:border-brand-400 dark:border-white/20 dark:bg-white/5',
              )}
            >
              <Check size={13} strokeWidth={3} />
            </button>
            <FileIcon name={d.fileName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold" title={d.fileName}>{d.fileName}</p>
              <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>{formatBytes(d.size)}</span>·<StatusBadge status={d.status} reason={d.statusReason} />
              </p>
            </div>

            {confirming === d.fileName ? (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => void handleDelete(d.fileName)}
                  disabled={deleting === d.fileName}
                  className="rounded-md bg-rose-500 px-2 py-1 text-[11px] font-bold text-white hover:bg-rose-600 disabled:opacity-60"
                >
                  {deleting === d.fileName ? <Loader2 size={12} className="animate-spin" /> : 'Delete'}
                </button>
                <button onClick={() => setConfirming(null)} className="rounded-md px-1.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-200/70 dark:hover:bg-white/10">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(d.fileName)}
                aria-label={`Delete ${d.fileName}`}
                className="shrink-0 rounded-md p-1.5 text-slate-400 opacity-100 transition hover:bg-rose-500/10 hover:text-rose-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
