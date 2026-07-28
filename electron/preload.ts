import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  platform: process.platform,
  getDailyContent: (category?: string, mode?: 'current' | 'growth', force?: boolean) => ipcRenderer.invoke('content:get-daily', category, mode, force),
  getGitHubRanking: (request: { category: 'projects' | 'skills'; period: 'all' | 'week' }) =>
    ipcRenderer.invoke('content:get-github', request),
  openExternal: (url: string) => ipcRenderer.invoke('content:open-external', url),
  notify: (title: string, body: string) => ipcRenderer.send('content:notify', { title, body }),
});
