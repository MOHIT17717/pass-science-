export type DeviceState = 'disconnected' | 'connected' | 'faulted';

export interface HardwareCapabilities {
  supported_protocols: string[];
  voltage_rails: string[];
  target_interfaces: string[];
  jtag_role: string;
  interconnect_note: string;
}

export interface DeviceInfo {
  id: string;
  name: string;
  category: string;
  target_silicon: string;
  description: string;
  host_interface: string;
  power_domains: string;
  physical_connectors: string;
  state: DeviceState;
  is_simulated: boolean;
  capabilities: HardwareCapabilities;
}

export interface EmbeddedDevicesResponse {
  status: 'ok' | 'error';
  is_simulated?: boolean;
  disclaimer?: string;
  devices?: DeviceInfo[];
  error?: string;
  details?: string;
}
export interface DeviceConnectionResponse {
  status: 'ok' | 'error';
  device_id?: string;
  state?: DeviceState;
  is_simulated?: boolean;
  error?: string;
  error_code?: string;
  message?: string;
  recoverable?: boolean;
}

export interface DeviceTelemetryResponse {
  status: 'ok' | 'error';
  device_id?: string;
  timestamp_ms?: number;
  is_simulated?: boolean;
  numeric_metrics?: Record<string, number>;
  text_metrics?: Record<string, string>;
  telemetry?: Array<{
    success: boolean;
    device_id: string;
    timestamp_ms?: number;
    numeric_metrics?: Record<string, number>;
    text_metrics?: Record<string, string>;
    error_code?: string;
    message?: string;
    recoverable?: boolean;
  }>;
  error?: string;
  error_code?: string;
  message?: string;
  recoverable?: boolean;
  fault_active?: boolean;
}

export interface DeviceFaultResponse {
  status: 'ok' | 'error';
  device_id?: string;
  action?: string;
  state?: DeviceState;
  is_simulated?: boolean;
  error?: string;
  details?: string;
}
