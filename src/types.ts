export type ProblemStatus = 'unsolved' | 'attempting' | 'solved' | 'review';
export type LedgerStatus = 'active' | 'completed' | 'paused' | 'archived';
export type LedgerImportance = 'high' | 'medium' | 'low';

export interface LedgerCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  categoryId: string;
  backgroundId: string;
  title: string;
  date: string;
  status: LedgerStatus;
  importance: LedgerImportance;
  notes: string;
  tags: string[];
  value?: number;
  unit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodoCollection {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface TodayTodo {
  id: string;
  collectionId: string;
  title: string;
  completed: boolean;
  backgroundId: string;
  createdAt: string;
  completedAt?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  color: string;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  color: string;
}

export interface Problem {
  id: string;
  title: string;
  source: string;
  difficulty: string;
  tags: string[];
  status: ProblemStatus;
  url: string;
  notes: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface FocusRecord {
  id: string;
  date: string;
  completedAt: string;
  minutes: number;
  sessions: number;
  taskId?: string;
  todoId?: string;
  collectionId?: string;
  backgroundId?: string;
  taskTitle: string;
  project: string;
}

export interface WorkspaceData {
  ledgerCategories: LedgerCategory[];
  ledgerEntries: LedgerEntry[];
  todoCollections: TodoCollection[];
  todayTodos: TodayTodo[];
  notes: Note[];
  bookmarks: Bookmark[];
  problems: Problem[];
  focusDate: string;
  focusMinutes: number;
  focusSessions: number;
  focusRecords: FocusRecord[];
}
