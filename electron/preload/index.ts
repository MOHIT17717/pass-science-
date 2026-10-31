import { contextBridge, ipcRenderer } from 'electron';
import type { BackendStatus, WorkbenchAPI } from './api';

const api: WorkbenchAPI = {
  getBackendStatus: async (): Promise<BackendStatus> => {
    return ipcRenderer.invoke('backend:get-status');
  },
  onBackendStatusChange: (callback: (status: BackendStatus) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: BackendStatus) => callback(status);
    ipcRenderer.on('backend:status-changed', handler);
    return () => {
      ipcRenderer.removeListener('backend:status-changed', handler);
    };
  }
};

contextBridge.exposeInMainWorld('workbenchAPI', api);

