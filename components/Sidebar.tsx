'use client';

import { ShieldCheck, X } from 'lucide-react';
import type { StudyDocument } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DocumentList } from './DocumentList';
import { FileUploader } from './FileUploader';
import { LogoBadge } from './Logo';

interface Props {
  userId: string;
  documents: StudyDocument[];
  loading: boolean;
  error: string | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onDelete: (fileName: string) => Promise<void>;
  selected: string[];
  onToggle: (fileName: string) => void;
  onSelectAll: () => void;
}

export function Sidebar({ userId, documents, loading, error, open, onClose, onRefresh, onDelete, selected, onToggle, onSelectAll }: Props) {
  return (
    <>
      {/* mobile backdrop */}
      <div
        onClick={onClose}
        className={cn('fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[86%] max-w-[340px] flex-col gap-5 border-r border-slate-200/70 bg-slate-50/95 p-4 backdrop-blur-xl transition-transform dark:border-white/10 dark:bg-slate-950/95 lg:static lg:z-auto lg:w-[320px] lg:max-w-none lg:translate-x-0 lg:bg-white/40 dark:lg:bg-slate-900/40',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-3">
          <LogoBadge />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold leading-tight tracking-tight">Poocho AI</h2>
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck size={11} /> 100% Syllabus-Grounded
            </span>
          </div>
          <button onClick={onClose} className="btn-icon lg:hidden" aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        {/* key={userId}: switching students resets the upload tray */}
        <FileUploader key={userId} userId={userId} documents={documents} onUploaded={onRefresh} />
        <DocumentList
          documents={documents}
          loading={loading}
          error={error}
          onRefresh={onRefresh}
          onDelete={onDelete}
          selected={selected}
          onToggle={onToggle}
          onSelectAll={onSelectAll}
        />
      </aside>
    </>
  );
}
