export interface ForwardState {
  x: number;
  y: number;
  z: number;
  h: number;
  y_hat: number;
  error: number;
  loss: number;
}

export interface Gradients {
  dJ_dw: number;
  dJ_db: number;
  dJ_dv: number;
  dJ_dc: number;
}

export interface ModelParameters {
  w: number;
  b: number;
  v: number;
  c: number;
}

export interface SingleGradientCheck {
  parameter: string;
  analytical_gradient: number;
  numerical_gradient: number;
  absolute_error: number;
  passed: boolean;
}

export interface GradientCheckReport {
  epsilon: number;
  tolerance: number;
  max_absolute_error: number;
  all_passed: boolean;
  checks: SingleGradientCheck[];
}

export interface TrainingRecord {
  step: number;
  loss: number;
  y_hat: number;
  w: number;
  b: number;
  v: number;
  c: number;
  grad_w: number;
  grad_b: number;
  grad_v: number;
  grad_c: number;
}

export interface BackpropTrainResponse {
  status: 'ok' | 'error';
  summary?: string;
  monotonic_loss_reduction?: boolean;
  final_loss_converged?: boolean;
  initial_forward?: ForwardState;
  initial_gradients?: Gradients;
  step1_parameters?: ModelParameters;
  step1_forward?: { y_hat: number; loss: number };
  gradient_check?: GradientCheckReport;
  history?: TrainingRecord[];
  total_records?: number;
  error?: string;
  details?: string;
}
