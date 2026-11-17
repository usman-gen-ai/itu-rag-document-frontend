import { FileCheck2, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { LogoBadge } from './Logo';

const FEATURES = [
  { icon: ShieldCheck, title: 'Zero Hallucinations', text: 'Answers come only from your files. If it’s not in your notes, Poocho AI says so.' },
  { icon: FileCheck2, title: 'Exact Page Citations', text: 'Every answer links to the document and page it came from, with the passage.' },
  { icon: Layers, title: 'Unlimited Free Notes', text: 'Upload as many slides, PDFs and notes as your syllabus needs.' },
];

export const QUICK_PROMPTS = [
  'Summarize key exam topics',
  'Generate 5 MCQs from my notes',
  'Explain the hardest concept in simple words',
  'Make a one-page revision cheat sheet',
];

export function EmptyState({ onPick, disabled }: { onPick: (q: string) => void; disabled: boolean }) {
  return (
    <div className="mx-auto flex max-w-3xl animate-fade-up flex-col items-center px-4 py-10 text-center sm:py-16">
      <LogoBadge size={56} />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Ask your notes,{' '}
        <span className="bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-transparent">not the internet</span>
      </h1>
      <p className="mt-3 max-w-xl text-balance text-slate-500 dark:text-slate-400">
        Upload your lecture slides, PDFs and notes, then chat with them. Generic AI guesses. Poocho AI only answers from your syllabus.
      </p>

      <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="glass rounded-2xl p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <span className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-300">
              <Icon size={18} />
            </span>
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            disabled={disabled}
            onClick={() => onPick(q)}
            className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition hover:border-brand-400 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-brand-200"
          >
            <Sparkles size={14} className="text-brand-500" />
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
