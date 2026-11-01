import type { BoundingBoxDTO, StlParseResult } from '../../../electron/preload/api';

export type StlModelData = StlParseResult;
export type { BoundingBoxDTO };

export interface GeometryViewOptions {
  showSurface: boolean;
  wireframe: boolean;
  opacity: number;
}
