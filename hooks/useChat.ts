'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, sendChat } from '@/lib/api';
import type { ChatMessage, ChatResponse } from '@/lib/types';
import { uid } from '@/lib/utils';

interface ChatState {
  messages: ChatMessage[];
  sessionId?: string;
  sending: boolean;
}

const EMPTY: ChatState = { messages: [], sending: false };
const MAX_STORED = 100;
const storageKey = (userId: string) => `poocho:chat:${userId}`;

function loadSaved(userId: string): { messages: ChatMessage[]; sessionId?: string } | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { messages?: ChatMessage[]; sessionId?: string };
    if (!Array.isArray(parsed.messages)) return null;
    return { messages: parsed.messages, sessionId: parsed.sessionId };
  } catch {
    return null; // corrupted or unavailable storage
  }
}

/** Per-student chat history (saved in localStorage) + Bedrock sessionId (so follow-up questions keep context). */
export function useChat(userId: string | null) {
  const [chats, setChats] = useState<Record<string, ChatState>>({});
  const chatsRef = useRef(chats);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const update = useCallback((id: string, fn: (c: ChatState) => ChatState) => {
    setChats((prev) => ({ ...prev, [id]: fn(prev[id] ?? EMPTY) }));
  }, []);

  // Restore the saved conversation when a student becomes active (only if nothing is in memory yet).
  useEffect(() => {
    if (!userId) return;
    const saved = loadSaved(userId);
    if (!saved) return;
    setChats((prev) =>
      prev[userId] ? prev : { ...prev, [userId]: { messages: saved.messages, sessionId: saved.sessionId, sending: false } },
    );
  }, [userId]);

  // Save after every change (not while a request is in flight).
  useEffect(() => {
    if (!userId) return;
    const c = chats[userId];
    if (!c || c.sending) return;
    try {
      if (c.messages.length === 0) localStorage.removeItem(storageKey(userId));
      else localStorage.setItem(storageKey(userId), JSON.stringify({ messages: c.messages.slice(-MAX_STORED), sessionId: c.sessionId }));
    } catch {
      /* storage full or unavailable: history lasts for this session only */
    }
  }, [chats, userId]);

  const send = useCallback(
    async (question: string, documents?: string[]) => {
      const q = question.trim();
      if (!userId || !q) return;
      const current = chatsRef.current[userId] ?? EMPTY;
      if (current.sending) return;

      const userMsg: ChatMessage = { id: uid(), role: 'user', content: q, createdAt: Date.now() };
      update(userId, (c) => ({ ...c, messages: [...c.messages, userMsg], sending: true }));

      try {
        let res: ChatResponse;
        try {
          res = await sendChat({ userId, question: q, sessionId: current.sessionId, documents });
        } catch (e) {
          // Bedrock sessions expire after idle time -> retry once as a fresh conversation.
          if (e instanceof ApiError && (e.status === 400 || e.status === 502) && current.sessionId) {
            res = await sendChat({ userId, question: q, documents });
          } else {
            throw e;
          }
        }
        const reply: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: res.answer,
          sources: res.sources ?? [],
          kind: res.type,
          createdAt: Date.now(),
        };
        update(userId, (c) => ({
          messages: [...c.messages, reply],
          sessionId: res.sessionId ?? c.sessionId,
          sending: false,
        }));
      } catch (e) {
        const reply: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
          isError: true,
          createdAt: Date.now(),
        };
        update(userId, (c) => ({ ...c, messages: [...c.messages, reply], sending: false }));
      }
    },
    [userId, update],
  );

  const clear = useCallback(() => {
    if (userId) update(userId, () => EMPTY);
  }, [userId, update]);

  const chat = (userId && chats[userId]) || EMPTY;
  return { messages: chat.messages, sending: chat.sending, send, clear };
}
