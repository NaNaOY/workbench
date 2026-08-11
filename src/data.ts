import {
  Bookmark,
  FocusRecord,
  LedgerCategory,
  LedgerEntry,
  LedgerImportance,
  LedgerStatus,
  Note,
  Problem,
  TodayTodo,
  TodoCollection,
  WorkspaceData,
} from './types';
import { DEFAULT_TODO_COLLECTIONS, FOCUS_BACKGROUNDS } from './todo-config';
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

const LEDGER_CATEGORY_SEEDS = [
  { id: 'ledger-work', name: '工作台账', color: '#6674dc' },
  { id: 'ledger-daily', name: '日常台账', color: '#56a47c' },
  { id: 'ledger-study', name: '学习台账', color: '#c98b45' },
];

function createDefaultLedgerCategories(): LedgerCategory[] {
  const createdAt = new Date().toISOString();
  return LEDGER_CATEGORY_SEEDS.map((category) => ({ ...category, createdAt }));
}

function defaultLedgerBackgroundId(categoryId: string) {
  if (categoryId === 'ledger-study') return 'forest-path';
  if (categoryId === 'ledger-daily') return 'dawn-lake';
  return 'alpine-night';
}

function createDefaultTodoCollections(): TodoCollection[] {
  const createdAt = new Date().toISOString();
  return DEFAULT_TODO_COLLECTIONS.map((collection) => ({ ...collection, createdAt }));
}

const seedLedgerCategories = createDefaultLedgerCategories();
const seedCreatedAt = new Date().toISOString();

export const seedWorkspace: WorkspaceData = {
  ledgerCategories: seedLedgerCategories,
  ledgerEntries: [
    {
      id: 'ledger-entry-1',
      categoryId: 'ledger-work',
      backgroundId: 'alpine-night',
      title: '梳理本周工作重点与交付节点',
      date: dayOffset(0),
      status: 'active',
      importance: 'high',
      notes: '明确本周三项关键成果、负责人和下一步动作。',
      tags: ['周计划', '推进中'],
      value: 3,
      unit: '项',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt,
    },
    {
      id: 'ledger-entry-2',
      categoryId: 'ledger-work',
      backgroundId: 'desert-dusk',
      title: '完成个人工作台台账模块方案',
      date: dayOffset(-1),
      status: 'completed',
      importance: 'high',
      notes: '完成页面信息架构、数据字段与本地存储方案。',
      tags: ['WorkBench', '产品'],
      value: 100,
      unit: '%',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt,
    },
    {
      id: 'ledger-entry-3',
      categoryId: 'ledger-study',
      backgroundId: 'forest-path',
      title: '阅读并归档三篇行业文章',
      date: dayOffset(-2),
      status: 'active',
      importance: 'medium',
      notes: '提炼核心观点，并记录可用于工作台的信息架构方法。',
      tags: ['阅读', '行业观察'],
      value: 3,
      unit: '篇',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt,
    },
    {
      id: 'ledger-entry-4',
      categoryId: 'ledger-daily',
      backgroundId: 'dawn-lake',
      title: '月度固定支出核对',
      date: dayOffset(-4),
      status: 'completed',
      importance: 'low',
      notes: '已完成账单与自动扣款项目核对。',
      tags: ['财务', '月度'],
      value: 4,
      unit: '项',
      createdAt: seedCreatedAt,
      updatedAt: seedCreatedAt,
    },
  ],
  todoCollections: createDefaultTodoCollections(),
  todayTodos: [],
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
  problems: [
    {
      id: 'problem-1',
      title: 'A + B 问题',
      source: '洛谷 P1000',
      difficulty: '入门',
      tags: ['基础'],
      status: 'solved',
      url: 'https://www.luogu.com.cn/problem/P1000',
      notes: '两数之和，注意整数溢出即可。',
      category: '入门',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'problem-2',
      title: '最长上升子序列',
      source: '洛谷 B3637',
      difficulty: '普及/提高-',
      tags: ['DP', '序列'],
      status: 'attempting',
      url: 'https://www.luogu.com.cn/problem/B3637',
      notes: '经典 LIS 问题，O(n log n) 贪心优化。',
      category: 'DP 专题',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ],
  focusDate: localDateKey(),
  focusMinutes: 0,
  focusSessions: 0,
  focusRecords: [],
};

function restoreLedgerCategories(value: unknown): LedgerCategory[] {
  if (!Array.isArray(value)) return createDefaultLedgerCategories();
  const restored = value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const category = item as Partial<LedgerCategory>;
    if (!category.id || !category.name) return [];
    return [{
      id: String(category.id),
      name: String(category.name),
      color: category.color ? String(category.color) : '#6674dc',
      createdAt: category.createdAt ? String(category.createdAt) : new Date().toISOString(),
    }];
  });
  return restored.length ? restored : createDefaultLedgerCategories();
}

function restoreLedgerEntries(value: unknown, categories: LedgerCategory[]): LedgerEntry[] {
  if (!Array.isArray(value)) return [];
  const categoryIds = new Set(categories.map((category) => category.id));
  const fallbackCategoryId = categories[0].id;
  const statuses = new Set<LedgerStatus>(['active', 'completed', 'paused', 'archived']);
  const importanceLevels = new Set<LedgerImportance>(['high', 'medium', 'low']);
  const backgroundIds = new Set(FOCUS_BACKGROUNDS.map((background) => background.id));
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const entry = item as Partial<LedgerEntry>;
    if (!entry.id || !entry.title) return [];
    const numericValue = Number(entry.value);
    const categoryId = entry.categoryId && categoryIds.has(String(entry.categoryId)) ? String(entry.categoryId) : fallbackCategoryId;
    return [{
      id: String(entry.id),
      categoryId,
      backgroundId: entry.backgroundId && backgroundIds.has(String(entry.backgroundId)) ? String(entry.backgroundId) : defaultLedgerBackgroundId(categoryId),
      title: String(entry.title),
      date: entry.date ? String(entry.date) : localDateKey(),
      status: entry.status && statuses.has(entry.status) ? entry.status : 'active',
      importance: entry.importance && importanceLevels.has(entry.importance) ? entry.importance : 'medium',
      notes: entry.notes ? String(entry.notes) : '',
      tags: Array.isArray(entry.tags) ? entry.tags.map(String).filter(Boolean) : [],
      value: entry.value !== undefined && Number.isFinite(numericValue) ? numericValue : undefined,
      unit: entry.unit ? String(entry.unit) : undefined,
      createdAt: entry.createdAt ? String(entry.createdAt) : new Date().toISOString(),
      updatedAt: entry.updatedAt ? String(entry.updatedAt) : new Date().toISOString(),
    }];
  });
}

type LegacyTask = {
  id?: unknown;
  title?: unknown;
  status?: unknown;
  priority?: unknown;
  due?: unknown;
  project?: unknown;
};

function migrateLegacyTasks(value: unknown, categories: LedgerCategory[]): LedgerEntry[] {
  if (!Array.isArray(value)) return [];
  const workCategory = categories.find((category) => category.id === 'ledger-work') ?? categories[0];
  const studyCategory = categories.find((category) => category.id === 'ledger-study') ?? workCategory;
  const dailyCategory = categories.find((category) => category.id === 'ledger-daily') ?? workCategory;
  const now = new Date().toISOString();
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const task = item as LegacyTask;
    if (!task.title) return [];
    const project = task.project ? String(task.project) : '';
    const category = /学习|阅读|课程/.test(project) ? studyCategory : /日常|生活|家庭/.test(project) ? dailyCategory : workCategory;
    return [{
      id: task.id ? `ledger-${String(task.id)}` : `ledger-migrated-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      categoryId: category.id,
      backgroundId: defaultLedgerBackgroundId(category.id),
      title: String(task.title),
      date: task.due ? String(task.due) : localDateKey(),
      status: task.status === 'done' ? 'completed' : 'active',
      importance: task.priority === 'high' || task.priority === 'low' ? task.priority : 'medium',
      notes: project ? `由原任务管理迁移 · ${project}` : '由原任务管理迁移',
      tags: project ? [project] : ['历史任务'],
      createdAt: now,
      updatedAt: now,
    } satisfies LedgerEntry];
  });
}

function restoreTodoCollections(value: unknown): TodoCollection[] {
  if (!Array.isArray(value)) return createDefaultTodoCollections();
  const restored = value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const collection = item as Partial<TodoCollection>;
    if (!collection.id || !collection.name) return [];
    return [{
      id: String(collection.id),
      name: String(collection.name),
      color: collection.color ? String(collection.color) : '#6f6de3',
      createdAt: collection.createdAt ? String(collection.createdAt) : new Date().toISOString(),
    }];
  });
  return restored.length ? restored : createDefaultTodoCollections();
}

function restoreTodayTodos(value: unknown, collections: TodoCollection[]): TodayTodo[] {
  if (!Array.isArray(value)) return [];
  const collectionIds = new Set(collections.map((collection) => collection.id));
  const fallbackCollectionId = collections[0].id;
  const backgroundIds = new Set(FOCUS_BACKGROUNDS.map((background) => background.id));
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const todo = item as Partial<TodayTodo>;
    if (!todo.id || !todo.title) return [];
    const completed = Boolean(todo.completed);
    return [{
      id: String(todo.id),
      collectionId: todo.collectionId && collectionIds.has(String(todo.collectionId)) ? String(todo.collectionId) : fallbackCollectionId,
      title: String(todo.title),
      completed,
      backgroundId: todo.backgroundId && backgroundIds.has(String(todo.backgroundId)) ? String(todo.backgroundId) : FOCUS_BACKGROUNDS[0].id,
      createdAt: todo.createdAt ? String(todo.createdAt) : new Date().toISOString(),
      completedAt: completed && todo.completedAt ? String(todo.completedAt) : undefined,
    }];
  });
}

function restoreFocusRecords(value: unknown): FocusRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Partial<FocusRecord>;
    const minutes = Number(record.minutes);
    const sessions = Number(record.sessions);
    if (!record.id || !record.date || !record.completedAt || !Number.isFinite(minutes) || minutes <= 0) return [];
    return [{
      id: String(record.id),
      date: String(record.date),
      completedAt: String(record.completedAt),
      minutes,
      sessions: Number.isFinite(sessions) && sessions > 0 ? sessions : 1,
      taskId: record.taskId ? String(record.taskId) : undefined,
      todoId: record.todoId ? String(record.todoId) : undefined,
      collectionId: record.collectionId ? String(record.collectionId) : undefined,
      backgroundId: record.backgroundId ? String(record.backgroundId) : undefined,
      taskTitle: record.taskTitle ? String(record.taskTitle) : '未关联待办',
      project: record.project ? String(record.project) : '未分类',
    }];
  });
}

export function loadWorkspace(): WorkspaceData {
  try {
    const saved = readStoredText(STORAGE_KEY);
    if (!saved) return seedWorkspace;
    const parsed = JSON.parse(saved) as Partial<WorkspaceData> & { tasks?: unknown };
    if (!Array.isArray(parsed.notes) || !Array.isArray(parsed.bookmarks)) return seedWorkspace;
    const today = localDateKey();
    const hasTodayFocusStats = parsed.focusDate === today;
    const ledgerCategories = restoreLedgerCategories(parsed.ledgerCategories);
    const ledgerEntries = Array.isArray(parsed.ledgerEntries)
      ? restoreLedgerEntries(parsed.ledgerEntries, ledgerCategories)
      : migrateLegacyTasks(parsed.tasks, ledgerCategories);
    const todoCollections = restoreTodoCollections(parsed.todoCollections);
    const todayTodos = restoreTodayTodos(parsed.todayTodos, todoCollections);
    const restoredRecords = restoreFocusRecords(parsed.focusRecords);
    const focusMinutes = hasTodayFocusStats ? Number(parsed.focusMinutes) || 0 : 0;
    const focusSessions = hasTodayFocusStats ? Number(parsed.focusSessions) || 0 : 0;
    const focusRecords = restoredRecords.length > 0 || focusMinutes <= 0
      ? restoredRecords
      : [{
        id: `focus-legacy-${today}`,
        date: today,
        completedAt: new Date(`${today}T12:00:00`).toISOString(),
        minutes: focusMinutes,
        sessions: Math.max(1, focusSessions),
        taskTitle: '历史专注',
        project: '未分类',
      }];
    return {
      ledgerCategories,
      ledgerEntries,
      todoCollections,
      todayTodos,
      notes: parsed.notes as Note[],
      bookmarks: parsed.bookmarks as Bookmark[],
      problems: Array.isArray(parsed.problems) ? (parsed.problems as Problem[]) : [],
      focusDate: today,
      focusMinutes,
      focusSessions,
      focusRecords,
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