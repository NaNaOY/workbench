import { Bookmark, Note, Task, WorkspaceData } from './types';
import { readStoredText, writeStoredJson, STORAGE_KEYS } from './storage';

export const STORAGE_KEY = STORAGE_KEYS.workspace;

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const dayOffset = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
};

export const seedWorkspace: WorkspaceData = {
  tasks: [
    { id: 'task-1', title: '梳理本周工作重点', status: 'doing', priority: 'high', due: dayOffset(0), project: '个人系统' },
    { id: 'task-2', title: '完成产品方案初稿', status: 'todo', priority: 'high', due: dayOffset(1), project: 'WorkBench' },
    { id: 'task-3', title: '阅读并归档三篇行业文章', status: 'todo', priority: 'medium', due: dayOffset(2), project: '学习' },
    { id: 'task-4', title: '整理会议行动项', status: 'done', priority: 'medium', due: dayOffset(0), project: '协作' },
  ],
  notes: [
    {
      id: 'note-1',
      title: '本周目标',
      content: '1. 交付个人工作台 MVP\n2. 每天留出 90 分钟深度工作\n3. 周五完成复盘',
      updatedAt: new Date().toISOString(),
      color: '#e8eeff',
    },
    {
      id: 'note-2',
      title: '灵感收集',
      content: '把高频重复操作做成快捷入口；让工作台成为每天打开的第一屏。',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      color: '#fff0dd',
    },
  ],
  bookmarks: [
    { id: 'link-1', title: 'Google Calendar', url: 'https://calendar.google.com', description: '查看日程与约会', color: '#e7f6ed' },
    { id: 'link-2', title: 'Notion', url: 'https://www.notion.so', description: '项目资料与知识库', color: '#f3ebff' },
    { id: 'link-3', title: 'ChatGPT', url: 'https://chatgpt.com', description: '协作与灵感助手', color: '#e5f6f4' },
  ],
  focusDate: localDateKey(),
  focusMinutes: 0,
  focusSessions: 0,
};

export function loadWorkspace(): WorkspaceData {
  try {
    const saved = readStoredText(STORAGE_KEY);
    if (!saved) return seedWorkspace;
    const parsed = JSON.parse(saved) as Partial<WorkspaceData>;
    if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.notes) || !Array.isArray(parsed.bookmarks)) return seedWorkspace;
    const today = localDateKey();
    const hasTodayFocusStats = parsed.focusDate === today;
    return {
      tasks: parsed.tasks as Task[],
      notes: parsed.notes as Note[],
      bookmarks: parsed.bookmarks as Bookmark[],
      focusDate: today,
      focusMinutes: hasTodayFocusStats ? Number(parsed.focusMinutes) || 0 : 0,
      focusSessions: hasTodayFocusStats ? Number(parsed.focusSessions) || 0 : 0,
    };
  } catch {
    return seedWorkspace;
  }
}

export function saveWorkspace(data: WorkspaceData) {
  writeStoredJson(STORAGE_KEY, data);
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
