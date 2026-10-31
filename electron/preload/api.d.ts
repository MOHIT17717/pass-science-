export interface BackendStatus {
  online: boolean;
  port: number | null;
  pid: number | null;
  error?: string;
}

export interface WorkbenchAPI {
  getBackendStatus: () => Promise<BackendStatus>;
  onBackendStatusChange: (callback: (status: BackendStatus) => void) => () => void;
  // Specific typed endpoints will be added in subsequent tasks
}

