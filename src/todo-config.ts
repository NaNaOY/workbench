import type { TodoCollection } from './types';

const BASE_URL = import.meta.env.BASE_URL;

export interface FocusBackground {
  id: string;
  name: string;
  description: string;
  src: string;
  accent: string;
}

export const FOCUS_BACKGROUNDS: FocusBackground[] = [
  {
    id: 'dawn-lake',
    name: '晨雾湖畔',
    description: '适合清晨规划与安静阅读',
    src: `${BASE_URL}assets/focus-backgrounds/dawn-lake.webp`,
    accent: '#8b91c9',
  },
  {
    id: 'forest-path',
    name: '林间微光',
    description: '适合需要持续推进的深度工作',
    src: `${BASE_URL}assets/focus-backgrounds/forest-path.webp`,
    accent: '#6f8f7b',
  },
  {
    id: 'rainy-window',
    name: '雨夜窗边',
    description: '适合夜间写作与沉浸整理',
    src: `${BASE_URL}assets/focus-backgrounds/rainy-window.webp`,
    accent: '#6576a7',
  },
  {
    id: 'desert-dusk',
    name: '暮色沙丘',
    description: '适合创意构思与独立思考',
    src: `${BASE_URL}assets/focus-backgrounds/desert-dusk.webp`,
    accent: '#b77768',
  },
  {
    id: 'alpine-night',
    name: '高山蓝时',
    description: '适合复盘、编码与长时专注',
    src: `${BASE_URL}assets/focus-backgrounds/alpine-night.webp`,
    accent: '#5878bb',
  },
];

export const DEFAULT_TODO_COLLECTIONS: Array<Pick<TodoCollection, 'id' | 'name' | 'color'>> = [
  { id: 'todo-set-inbox', name: '今日临时待办', color: '#6f6de3' },
  { id: 'todo-set-work', name: '工作待办', color: '#4d8f85' },
  { id: 'todo-set-study', name: '学习待办', color: '#b4774e' },
];

export const TODO_COLLECTION_COLORS = ['#6f6de3', '#4d8f85', '#b4774e', '#7d68a8', '#4c7da8', '#9a6a78'];

export function focusBackgroundById(id?: string) {
  return FOCUS_BACKGROUNDS.find((background) => background.id === id) ?? FOCUS_BACKGROUNDS[0];
}
