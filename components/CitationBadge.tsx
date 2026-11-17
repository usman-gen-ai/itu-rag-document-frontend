'use client';

import { FileText, Quote } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Source } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DocGroup {
  documentName: string;
  sources: Source[]; // sorted by page (pages without a number last)
}

function groupByDocument(sources: Source[]): DocGroup[] {
  const map = new Map<string, Source[]>();
  for (const s of sources) {
    const list = map.get(s.documentName);
    if (list) list.push(s);
    else map.set(s.documentName, [s]);
  }
  return Array.from(map, ([documentName, list]) => ({
    documentName,
    sources: [...list].sort((a, b) => (a.page ?? Infinity) - (b.page ?? Infinity)),
  }));
}

function pagesLabel(group: DocGroup): string {
  const pages = group.sources.map((s) => s.page).filter((p): p is number => p !== null);
  if (pages.length === 0) return '';
  return `${pages.length > 1 ? 'pp.' : 'p.'} ${pages.join(', ')}`;
}

interface BadgeProps {
  group: DocGroup;
  index: number;
  active: boolean;
  onToggle: () => void;
}

/** One pill per document, e.g. `Road_Map.pdf • pp. 2, 15, 26`. */
export function CitationBadge({ group, index, active, onToggle }: BadgeProps) {
  const pages = pagesLabel(group);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={active}
      title="Show the exact passages from this document"
      className={cn(
        'group inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
        active
          ? 'border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-500/25'
          : 'border-slate-200 bg-white/70 text-slate-600 hover:border-brand-400 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-brand-200',
      )}
    >
      <span
        className={cn(
          'grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px]',
          active ? 'bg-white/25' : 'bg-brand-500/15 text-brand-600 dark:text-brand-300',
        )}
      >
        {index + 1}
      </span>
      <FileText size={12} className="shrink-0" />
      <span className="truncate">{group.documentName}</span>
      {pages && <span className={cn('shrink-0 font-medium', active ? 'text-white/80' : 'text-slate-400')}>• {pages}</span>}
    </button>
  );
}

/** Row of pills (one per document); clicking one expands the retrieved passages underneath. */
export function CitationList({ sources }: { sources: Source[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const groups = useMemo(() => groupByDocument(sources), [sources]);
  if (groups.length === 0) return null;
  const open = openIdx !== null ? groups[openIdx] : null;

  return (
    <div className="mt-4 border-t border-slate-200/70 pt-3 dark:border-white/10">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Sources from your notes
      </p>
      <div className="flex flex-wrap gap-2">
        {groups.map((g, i) => (
          <CitationBadge
            key={g.documentName}
            group={g}
            index={i}
            active={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>

      {open && (
        <div className="mt-3 animate-fade-up space-y-3 rounded-xl border border-brand-500/20 bg-brand-500/5 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
            <Quote size={13} />
            <span className="truncate">{open.documentName}</span>
          </div>
          <div className="max-h-56 space-y-3 overflow-y-auto">
            {open.sources.map((s, i) => (
              <div key={`${s.page}-${i}`}>
                {s.page !== null && <p className="mb-0.5 text-[11px] font-semibold text-slate-400">Page {s.page}</p>}
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {s.snippet.trim() || 'No preview text available for this passage.'}
                  {s.snippet.length >= 300 && '…'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
