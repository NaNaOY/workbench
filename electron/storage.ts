import { app, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export type StorageSnapshot = Record<string, string>;

const storageFileName = 'workbench-storage.json';

export function getStorageFilePath() {
  return path.join(app.getPath('userData'), storageFileName);
}

function isStorageSnapshot(value: unknown): value is StorageSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value).every((item) => typeof item === 'string');
}

export function readStorageSync(): StorageSnapshot | null {
  const filePath = getStorageFilePath();
  if (!fs.existsSync(filePath)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { values?: unknown } | unknown;
    const values = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'values' in parsed
      ? (parsed as { values?: unknown }).values
      : parsed;
    return isStorageSnapshot(values) ? values : null;
  } catch {
    return null;
  }
}

export function writeStorage(snapshot: unknown) {
  if (!isStorageSnapshot(snapshot)) return;

  const filePath = getStorageFilePath();
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });

  const temporaryPath = `${filePath}.tmp`;
  const payload = JSON.stringify({
    version: 1,
    updatedAt: new Date().toISOString(),
    values: snapshot,
  }, null, 2);

  fs.writeFileSync(temporaryPath, payload, 'utf8');
  try {
    fs.renameSync(temporaryPath, filePath);
  } catch {
    // Windows cannot always replace an existing file with renameSync.
    fs.copyFileSync(temporaryPath, filePath);
    fs.rmSync(temporaryPath, { force: true });
  }
}

export function registerStorageIpc() {
  ipcMain.on('storage:read-sync', (event) => {
    event.returnValue = readStorageSync();
  });

  ipcMain.on('storage:write', (_event, snapshot: unknown) => {
    writeStorage(snapshot);
  });

  ipcMain.handle('storage:get-path', () => getStorageFilePath());
}
