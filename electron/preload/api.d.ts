export interface BackendStatus {
  online: boolean;
  port: number | null;
  pid: number | null;
  error?: string;
}

export interface BoundingBoxDTO {
  min: [number, number, number];
  max: [number, number, number];
  dimensions: [number, number, number];
}

export interface StlParseResult {
  status: 'ok' | 'error';
  solid_name?: string;
  triangle_count?: number;
  bbox?: BoundingBoxDTO;
  normals_recomputed_count?: number;
  positions?: number[];
  normals?: number[];
  units?: { position: string };
  error?: string;
  code?: number | string;
  details?: string;
}

export interface TemperatureStatsDTO {
  min_temperature_C: number;
  max_temperature_C: number;
  avg_temperature_C: number;
}

export interface CsvParseResult {
  status: 'ok' | 'error';
  node_count?: number;
  is_synthetic?: boolean;
  provenance?: string;
  bbox?: BoundingBoxDTO;
  temperature_stats?: TemperatureStatsDTO;
  node_ids?: number[];
  positions?: number[];
  temperatures_C?: number[];
  units?: { position: string; temperature: string };
  error?: string;
  code?: number | string;
  details?: string;
}

export interface FilePayload {
  filename: string;
  content: string;
}

export interface WorkbenchAPI {
  getBackendStatus: () => Promise<BackendStatus>;
  onBackendStatusChange: (callback: (status: BackendStatus) => void) => () => void;
  parseStl: (content: string) => Promise<StlParseResult>;
  parseCsv: (content: string) => Promise<CsvParseResult>;
  openFileDialog: (type: 'stl' | 'csv') => Promise<FilePayload | null>;
  loadSample: (type: 'stl' | 'csv') => Promise<FilePayload>;
}

