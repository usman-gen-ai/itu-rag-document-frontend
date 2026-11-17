'use client';

import { AlertTriangle, SearchX } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CitationList } from './CitationBadge';
import { LogoBadge } from './Logo';

const mdComponents: Components = {
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
      <table className="!my-0 w-full text-sm">{children}</table>
    </div>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex animate-fade-up justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-md shadow-brand-500/20 sm:max-w-[75%]">
          {message.content}
        </div>
      </div>
    );
  }

  // Only a real "not found" answer gets the note; greetings/small talk (kind === 'chat') get nothing.
  const showNotFoundNote = !message.isError && message.kind === 'notfound';

  return (
    <div className="flex animate-fade-up gap-3">
      <div className="mt-1 hidden sm:block">
        <LogoBadge size={30} />
      </div>
      <div
        className={cn(
          'glass min-w-0 max-w-full flex-1 rounded-2xl rounded-tl-md px-4 py-3.5 shadow-sm sm:px-5',
          message.isError && 'border-rose-300/60 bg-rose-50/80 dark:border-rose-500/30 dark:bg-rose-500/10',
        )}
      >
        {message.isError ? (
          <p className="flex items-start gap-2 text-sm font-medium text-rose-700 dark:text-rose-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {message.content}
          </p>
        ) : (
          <div className="md prose prose-slate prose-sm max-w-none break-words dark:prose-invert prose-headings:font-bold prose-p:leading-relaxed prose-th:bg-slate-100 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 dark:prose-th:bg-white/5 sm:prose-base">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {message.sources && message.sources.length > 0 && <CitationList sources={message.sources} />}

        {showNotFoundNote && (
          <p className="mt-3 flex items-center gap-1.5 border-t border-slate-200/70 pt-3 text-xs text-slate-500 dark:border-white/10">
            <SearchX size={13} /> No supporting passage found in your notes, so nothing was guessed.
          </p>
        )}
      </div>
    </div>
  );
}
