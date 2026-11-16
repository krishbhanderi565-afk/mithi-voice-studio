import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('mavsDesktop', {
  isDesktop: true,
  getBackendUrl: (): Promise<string> => ipcRenderer.invoke('get-backend-url'),
  getBackendPort: (): Promise<number> => ipcRenderer.invoke('get-backend-port'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('open-external', url),
  onBackendStatus: (callback: (status: { ready: boolean; error?: string }) => void) => {
    ipcRenderer.on('backend-status', (_event, value) => callback(value));
  },
});
