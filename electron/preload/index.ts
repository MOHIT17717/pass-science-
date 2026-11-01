import { contextBridge, ipcRenderer } from 'electron';
import type { BackendStatus, CsvParseResult, FilePayload, StlParseResult, WorkbenchAPI } from './api';

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
  },
  parseStl: async (content: string): Promise<StlParseResult> => {
    return ipcRenderer.invoke('api:parse-stl', content);
  },
  parseCsv: async (content: string): Promise<CsvParseResult> => {
    return ipcRenderer.invoke('api:parse-csv', content);
  },
  openFileDialog: async (type: 'stl' | 'csv'): Promise<FilePayload | null> => {
    return ipcRenderer.invoke('dialog:open-file', type);
  },
  loadSample: async (type: 'stl' | 'csv'): Promise<FilePayload> => {
    return ipcRenderer.invoke('sample:load', type);
  }
};

contextBridge.exposeInMainWorld('workbenchAPI', api);

