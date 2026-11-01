export interface ThermalProblemMeta {
  length_m: number;
  area_m2: number;
  conductivity_W_mK: number;
  generation_W_m3: number;
  left_temperature_C: number;
  right_temperature_C: number;
}

export interface AnalyticalCurveDTO {
  sample_count: number;
  x_m: number[];
  temperature_C: number[];
}

export interface ThermalMidpointRecord {
  element_id: number;
  x_mid_m: number;
  interpolated_fem_temperature_C: number;
  analytical_temperature_C: number;
  error_C: number;
}

export interface ThermalMeshResult {
  elements: number;
  node_count: number;
  element_length_m: number;
  max_nodal_error_C: number;
  max_midpoint_error_C: number;
  theoretical_midpoint_error_C: number;
  convergence_rate: number;
  x_m: number[];
  fem_temperature_C: number[];
  analytical_temperature_C: number[];
  nodal_error_C: number[];
  midpoints: ThermalMidpointRecord[];
}

export interface ThermalSolveResponse {
  status: 'ok' | 'error';
  problem?: ThermalProblemMeta;
  units?: Record<string, string>;
  assumptions?: string[];
  analytical_curve?: AnalyticalCurveDTO;
  mesh?: ThermalMeshResult;
  meshes?: ThermalMeshResult[];
  summary?: string;
  verified?: boolean;
  error?: string;
  details?: string;
}

export type JobExecutionStatus = 'idle' | 'running' | 'completed' | 'error';

export interface ThermalJobState {
  status: JobExecutionStatus;
  executionTimeMs?: number;
  error?: string;
}
