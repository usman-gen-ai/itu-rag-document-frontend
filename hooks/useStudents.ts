'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Student } from '@/lib/types';

const STUDENTS_KEY = 'poocho:students';
const ACTIVE_KEY = 'poocho:activeStudent';
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/; // same rule the backend enforces

const makeId = () => `student_${Math.random().toString(36).slice(2, 8)}`;

function load(): { students: Student[]; activeId: string } {
  let students: Student[] = [];
  try {
    const raw = JSON.parse(localStorage.getItem(STUDENTS_KEY) ?? '[]');
    if (Array.isArray(raw)) {
      students = raw.filter(
        (s): s is Student => s && typeof s.id === 'string' && ID_RE.test(s.id) && typeof s.name === 'string',
      );
    }
  } catch {
    /* corrupted storage: start fresh */
  }
  if (students.length === 0) students = [{ id: makeId(), name: 'Student 1' }];
  let activeId = '';
  try {
    activeId = localStorage.getItem(ACTIVE_KEY) ?? '';
  } catch {
    /* ignore */
  }
  if (!students.some((s) => s.id === activeId)) activeId = students[0].id;
  return { students, activeId };
}

function persist(students: Student[], activeId: string) {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    localStorage.setItem(ACTIVE_KEY, activeId);
  } catch {
    /* storage unavailable (private mode): profiles last for this session only */
  }
}

/** Mock multi-user layer: persistent student profiles, each with its own isolated userId. */
export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const s = load();
    setStudents(s.students);
    setActiveId(s.activeId);
    persist(s.students, s.activeId);
  }, []);

  const switchTo = useCallback(
    (id: string) => {
      setActiveId(id);
      persist(students, id);
    },
    [students],
  );

  const addStudent = useCallback(() => {
    const next: Student = { id: makeId(), name: `Student ${students.length + 1}` };
    const list = [...students, next];
    setStudents(list);
    setActiveId(next.id);
    persist(list, next.id);
  }, [students]);

  const active = students.find((s) => s.id === activeId) ?? null;
  return { students, active, ready: active !== null, switchTo, addStudent };
}
