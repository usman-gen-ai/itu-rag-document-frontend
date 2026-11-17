'use client';

import { ArrowUp, Files, Info, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';
import { LogoBadge } from './Logo';
import { MessageBubble } from './MessageBubble';

const MAX_LEN = 2000; // backend limit
const THINKING_STEPS = ['Searching your notes...', 'Reading the most relevant pages...', 'Writing a grounded answer...'];

function ThinkingIndicator() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, THINKING_STEPS.length - 1)), 2500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex animate-fade-up gap-3" role="status" aria-live="polite">
      <div className="mt-1 hidden sm:block">
        <LogoBadge size={30} />
      </div>
      <div className="glass flex items-center gap-3 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 animate-bounce-dot rounded-full bg-brand-500" style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{THINKING_STEPS[step]}</span>
      </div>
    </div>
  );
}

interface Props {
  messages: ChatMessage[];
  sending: boolean;
  onSend: (question: string) => void;
  readyDocCount: number;
  processingDocCount: number;
  docsLoading: boolean;
  /** File names the chat searches in; empty = all documents. */
  selected: string[];
}

export function ChatArea({ messages, sending, onSend, readyDocCount, processingDocCount, docsLoading, selected }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, sending]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const submit = (text = input) => {
    const q = text.trim();
    if (!q || sending || q.length > MAX_LEN) return;
    onSend(q);
    setInput('');
  };

  const noDocs = !docsLoading && readyDocCount === 0;
  const canSend = input.trim().length > 0 && !sending && input.length <= MAX_LEN;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onPick={submit} disabled={sending} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {sending && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-2">
        <div className="mx-auto max-w-3xl">
          {(noDocs || processingDocCount > 0) && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              {processingDocCount > 0 ? <Loader2 size={14} className="animate-spin" /> : <Info size={14} />}
              {processingDocCount > 0
                ? `${processingDocCount} file${processingDocCount > 1 ? 's are' : ' is'} still syncing. Answers will include them once Ready.`
                : 'Upload a PDF, DOCX or TXT in the sidebar first, then ask questions about it.'}
            </div>
          )}
          {readyDocCount > 0 && (
            <p
              className="mb-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300"
              title={selected.length > 0 ? selected.join('\n') : 'All ready documents'}
            >
              <Files size={12} className="shrink-0" />
              <span className="truncate">
                Searching: {selected.length === 0 ? 'All documents' : `${selected.length} document${selected.length > 1 ? 's' : ''}`}
              </span>
            </p>
          )}
          <div className="glass flex items-end gap-2 rounded-2xl p-2 shadow-lg shadow-slate-900/5 transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20">
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask anything about your uploaded notes…"
              aria-label="Your question"
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] outline-none placeholder:text-slate-400"
            />
            <button
              onClick={() => submit()}
              disabled={!canSend}
              aria-label="Send question"
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl transition',
                canSend
                  ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30 hover:scale-105'
                  : 'bg-slate-200 text-slate-400 dark:bg-white/10',
              )}
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            {input.length > MAX_LEN - 200 ? (
              <span className={input.length > MAX_LEN ? 'text-rose-500' : ''}>{input.length}/{MAX_LEN}</span>
            ) : (
              'Answers are grounded strictly in your uploaded files. Enter to send, Shift+Enter for a new line.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
