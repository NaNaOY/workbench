export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type ProblemStatus = 'unsolved' | 'attempting' | 'solved' | 'review';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  due: string;
  project: string;
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
  taskTitle: string;
  project: string;
}

export interface WorkspaceData {
  tasks: Task[];
  notes: Note[];
  bookmarks: Bookmark[];
  problems: Problem[];
  focusDate: string;
  focusMinutes: number;
  focusSessions: number;
  focusRecords: FocusRecord[];
}
