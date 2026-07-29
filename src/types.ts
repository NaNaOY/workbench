export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'doing' | 'done';

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

export interface WorkspaceData {
  tasks: Task[];
  notes: Note[];
  bookmarks: Bookmark[];
  focusDate: string;
  focusMinutes: number;
  focusSessions: number;
}
