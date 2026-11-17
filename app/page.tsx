'use client';

import { AlertTriangle, Eraser, Menu } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ChatArea } from '@/components/ChatArea';
import { LogoBadge } from '@/components/Logo';
import { Sidebar } from '@/components/Sidebar';
import { StudentSwitcher } from '@/components/StudentSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useChat } from '@/hooks/useChat';
import { useDocuments } from '@/hooks/useDocuments';
import { useStudents } from '@/hooks/useStudents';
import { isApiConfigured } from '@/lib/api';

export default function Home() {
  const { students, active, ready, switchTo, addStudent } = useStudents();
  const userId = active?.id ?? null;
  const docs = useDocuments(userId);
  const chat = useChat(userId);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Which documents the chat searches in, per student. Empty = all documents.
  const [selectedByUser, setSelectedByUser] = useState<Record<string, string[]>>({});
  const selected = (userId && selectedByUser[userId]) || [];
  const readyNames = docs.documents.filter((d) => d.status === 'READY').map((d) => d.fileName);

  const setSelected = useCallback(
    (list: string[]) => {
      if (userId) setSelectedByUser((prev) => ({ ...prev, [userId]: list }));
    },
    [userId],
  );

  const toggleDoc = (fileName: string) => {
    if (!readyNames.includes(fileName)) return;
    const current = selected.length === 0 ? readyNames : selected;
    const next = current.includes(fileName) ? current.filter((n) => n !== fileName) : [...current, fileName];
    if (next.length === 0) return; // keep at least one document selected
    setSelected(next.length === readyNames.length ? [] : next); // everything selected = "all"
  };

  // Drop selected files that were deleted or are no longer Ready.
  const readyKey = readyNames.join('|');
  useEffect(() => {
    if (!userId || docs.loading) return;
    const sel = selectedByUser[userId];
    if (!sel || sel.length === 0) return;
    const names = readyKey ? readyKey.split('|') : [];
    const kept = sel.filter((n) => names.includes(n));
    if (kept.length !== sel.length) setSelectedByUser((prev) => ({ ...prev, [userId]: kept.length === names.length ? [] : kept }));
  }, [readyKey, docs.loading, userId, selectedByUser]);

  if (!ready || !active || !userId) {
    return (
      <div className="app-bg grid h-dvh place-items-center">
        <div className="animate-pulse"><LogoBadge size={48} /></div>
      </div>
    );
  }

  const readyCount = docs.documents.filter((d) => d.status === 'READY').length;
  const processingCount = docs.documents.filter((d) => d.status !== 'READY' && d.status !== 'FAILED').length;

  return (
    <div className="app-bg flex h-dvh overflow-hidden">
      <Sidebar
        userId={userId}
        documents={docs.documents}
        loading={docs.loading}
        error={docs.error}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onRefresh={() => void docs.refresh()}
        onDelete={docs.remove}
        selected={selected}
        onToggle={toggleDoc}
        onSelectAll={() => setSelected([])}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-slate-200/70 px-3 py-2.5 dark:border-white/10 sm:px-5">
          <button onClick={() => setSidebarOpen(true)} className="btn-icon lg:hidden" aria-label="Open study material">
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold sm:text-base">Study Chat</h1>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {readyCount} file{readyCount === 1 ? '' : 's'} ready · userId <span className="font-mono">{userId}</span>
            </p>
          </div>
          {chat.messages.length > 0 && (
            <button onClick={chat.clear} className="btn-icon" aria-label="Clear conversation" title="Clear conversation">
              <Eraser size={18} />
            </button>
          )}
          <ThemeToggle />
          <StudentSwitcher students={students} active={active} onSwitch={switchTo} onAdd={addStudent} />
        </header>

        {!isApiConfigured && (
          <div className="flex items-center gap-2 border-b border-amber-300/50 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
            <AlertTriangle size={14} />
            <span>
              <code className="font-mono">NEXT_PUBLIC_API_URL</code> is not set. Copy <code className="font-mono">.env.local.example</code> to <code className="font-mono">.env.local</code> and restart the dev server.
            </span>
          </div>
        )}

        <ChatArea
          messages={chat.messages}
          sending={chat.sending}
          onSend={(q) => void chat.send(q, selected.length > 0 ? selected : undefined)}
          readyDocCount={readyCount}
          processingDocCount={processingCount}
          docsLoading={docs.loading}
          selected={selected}
        />
      </main>
    </div>
  );
}
