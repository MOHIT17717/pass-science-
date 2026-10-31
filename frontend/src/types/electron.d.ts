import type { WorkbenchAPI } from '../../../electron/preload/api';

declare global {
  interface Window {
    workbenchAPI?: WorkbenchAPI;
  }
}

export {};

