import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'node:path';
import { registerContentIpc } from './content';
import { registerStorageIpc } from './storage';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  nativeTheme.themeSource = 'light';
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1060,
    minHeight: 700,
    backgroundColor: '#f5f6fb',
    icon: path.join(app.getAppPath(), 'public', 'assets', 'workbench-icon.png'),
    titleBarStyle: 'hiddenInset',
    title: 'WorkBench',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  registerStorageIpc();
  registerContentIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
