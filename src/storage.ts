export const STORAGE_KEYS = {
  workspace: 'workbench:data:v1',
  cognitionReflectionHistory: 'workbench:cognition-outputs:v1',
  cognitionCache: (mode: string, category: string) => `workbench:cognition:${mode}:${category}:v5`,
  cognitionReflection: (mode: string, category: string, date: string) => `workbench:cognition-reflection:${mode}:${category}:${date}`,
  githubRanking: (category: string, period: string) => `workbench:github:${category}:${period}:v1`,
} as const;

export function readStoredText(key: string, fallback = '') {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredText(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export function readStoredJson<T>(key: string): T | null {
  const value = readStoredText(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function writeStoredJson<T>(key: string, value: T) {
  try {
    writeStoredText(key, JSON.stringify(value));
  } catch {
    // Ignore serialization failures so UI interactions remain responsive.
  }
}