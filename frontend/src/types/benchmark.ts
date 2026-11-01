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

export type BenchmarkJobStatus = 'idle' | 'running' | 'completed' | 'error';

export interface BenchmarkJobState {
  status: BenchmarkJobStatus;
  executionTimeMs?: number;
  error?: string;
}
