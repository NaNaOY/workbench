import { contextBridge, ipcRenderer } from 'electron';

type StorageSnapshot = Record<string, string>;

function readStorageSnapshot(): StorageSnapshot {
  const snapshot: StorageSnapshot = {};
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key) snapshot[key] = localStorage.getItem(key) ?? '';
    }
  } catch {
    // The renderer may briefly be unavailable while the window is closing.
  }
  return snapshot;
}

function restoreStorageSnapshot() {
  const persisted = ipcRenderer.sendSync('storage:read-sync') as StorageSnapshot | null;
  if (!persisted || typeof persisted !== 'object') return false;

  try {
    localStorage.clear();
    Object.entries(persisted).forEach(([key, value]) => localStorage.setItem(key, value));
    return true;
  } catch {
    return false;
  }
}

const restoredFromFile = restoreStorageSnapshot();
let lastSent = restoredFromFile ? JSON.stringify(readStorageSnapshot()) : '';
let pending: { serialized: string; snapshot: StorageSnapshot } | null = null;
let pendingTimer = 0;

function sendPendingStorage() {
  if (!pending) return;
  const next = pending;
  pending = null;
  lastSent = next.serialized;
  ipcRenderer.send('storage:write', next.snapshot);
}

function queueStorageSync() {
  const snapshot = readStorageSnapshot();
  // An accidental browser-data clear should never erase the file backup.
  if (!Object.keys(snapshot).length && lastSent && lastSent !== '{}') return;

  const serialized = JSON.stringify(snapshot);
  if (serialized === lastSent || serialized === pending?.serialized) return;
  pending = { serialized, snapshot };
  window.clearTimeout(pendingTimer);
  pendingTimer = window.setTimeout(sendPendingStorage, 180);
}

function flushStorageNow() {
  queueStorageSync();
  window.clearTimeout(pendingTimer);
  sendPendingStorage();
}

window.setInterval(queueStorageSync, 700);
window.addEventListener('beforeunload', flushStorageNow);

contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  platform: process.platform,
  persistStorage: queueStorageSync,
  getStoragePath: () => ipcRenderer.invoke('storage:get-path'),
  getDailyContent: (category?: string, mode?: 'current' | 'growth' | 'overseas', force?: boolean) => ipcRenderer.invoke('content:get-daily', category, mode, force),
  onDailyUpdated: (listener: () => void) => {
    const handler = () => listener();
    ipcRenderer.on('content:daily-updated', handler);
    return () => ipcRenderer.removeListener('content:daily-updated', handler);
  },
  getGitHubRanking: (request: { category: 'projects' | 'skills'; period: 'all' | 'week' }) =>
    ipcRenderer.invoke('content:get-github', request),
  getFuturesMarket: (selectedKey?: string) => ipcRenderer.invoke('futures:get-market', selectedKey),
  openExternal: (url: string, allowInternationalSources = false) => ipcRenderer.invoke('content:open-external', url, allowInternationalSources),
  notify: (title: string, body: string) => ipcRenderer.send('content:notify', { title, body }),
});