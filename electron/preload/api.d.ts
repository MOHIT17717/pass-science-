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

export interface ThermalSolveResponse {
  status: 'ok' | 'error';
  problem?: {
    length_m: number;
    area_m2: number;
    conductivity_W_mK: number;
    generation_W_m3: number;
    left_temperature_C: number;
    right_temperature_C: number;
  };
  units?: Record<string, string>;
  assumptions?: string[];
  analytical_curve?: {
    sample_count: number;
    x_m: number[];
    temperature_C: number[];
  };
  mesh?: any;
  meshes?: any[];
  summary?: string;
  verified?: boolean;
  error?: string;
  details?: string;
}

export interface BenchmarkConfigDTO {
  case_count: number;
  elements: number;
  worker_counts?: number[];
  repetitions?: number;
  seed?: number;
}

export interface EnvironmentInfoDTO {
  cpu_model: string;
  logical_cores: number;
  physical_cores: number;
  total_ram_bytes: number;
  compiler: string;
  build_mode: string;
  timer_clock: string;
  timing_scope: string;
}

export interface WorkerBenchmarkResultDTO {
  worker_count: number;
  is_serial_baseline: boolean;
  repetition_ms: number[];
  median_ms: number;
  speedup: number;
  efficiency: number;
  max_discrepancy_vs_serial_C: number;
  numerical_agreement_passed: boolean;
}

export interface BenchmarkSuiteResponse {
  status: 'ok' | 'error';
  config?: BenchmarkConfigDTO;
  environment?: EnvironmentInfoDTO;
  worker_results?: WorkerBenchmarkResultDTO[];
  max_global_discrepancy_C?: number;
  numerical_agreement_passed?: boolean;
  all_passed?: boolean;
  notes?: string;
  error?: string;
  details?: string;
}

export interface WorkbenchAPI {
  getBackendStatus: () => Promise<BackendStatus>;
  onBackendStatusChange: (callback: (status: BackendStatus) => void) => () => void;
  parseStl: (content: string) => Promise<StlParseResult>;
  parseCsv: (content: string) => Promise<CsvParseResult>;
  openFileDialog: (type: 'stl' | 'csv') => Promise<FilePayload | null>;
  loadSample: (type: 'stl' | 'csv') => Promise<FilePayload>;
  solveThermal: (elements?: number) => Promise<ThermalSolveResponse>;
  exportThermalCsv: (elements: number, type: 'nodal' | 'midpoint' | 'combined') => Promise<{ status: 'ok' | 'error'; csv?: string; error?: string; rowCount?: number }>;
  saveCsvFile: (defaultFilename: string, content: string) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>;
  runBenchmark: (config?: Partial<BenchmarkConfigDTO>) => Promise<BenchmarkSuiteResponse>;
  exportBenchmarkCsv: (config?: Partial<BenchmarkConfigDTO>) => Promise<{ status: 'ok' | 'error'; csv?: string; error?: string; rowCount?: number }>;
}

