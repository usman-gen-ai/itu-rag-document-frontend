'use client';

import { Check, ChevronDown, Plus, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Student } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  students: Student[];
  active: Student;
  onSwitch: (id: string) => void;
  onAdd: () => void;
}

export function StudentSwitcher({ students, active, onSwitch, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="glass flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2.5 text-sm font-semibold shadow-sm transition hover:border-brand-400/60"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-300">
          <UserRound size={15} />
        </span>
        <span className="hidden max-w-[9rem] truncate sm:block">{active.name}</span>
        <ChevronDown size={15} className={cn('text-slate-400 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          className="glass absolute right-0 z-40 mt-2 w-64 animate-fade-up rounded-2xl p-1.5 shadow-xl dark:bg-slate-900/95"
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Switch student (isolated notes)
          </p>
          {students.map((s) => (
            <button
              key={s.id}
              role="option"
              aria-selected={s.id === active.id}
              onClick={() => {
                onSwitch(s.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{s.name}</span>
                <span className="block truncate font-mono text-[11px] text-slate-400">{s.id}</span>
              </span>
              {s.id === active.id && <Check size={16} className="text-brand-500" />}
            </button>
          ))}
          <button
            onClick={() => {
              onAdd();
              setOpen(false);
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-2.5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-500/10 dark:border-white/15 dark:text-brand-300"
          >
            <Plus size={16} /> New student profile
          </button>
        </div>
      )}
    </div>
  );
}
