import type { CsvParseResult, TemperatureStatsDTO } from '../../../electron/preload/api';

export type TemperatureDatasetData = CsvParseResult;
export type { TemperatureStatsDTO };

export interface InspectedNode {
  nodeId: number;
  x: number;
  y: number;
  z: number;
  temperature: number;
}

export interface TemperatureViewOptions {
  showPoints: boolean;
  pointSize: number;
  overlayWithCad: boolean;
}
