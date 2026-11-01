import React, { useState } from 'react';
import type { AnalyticalCurveDTO, ThermalMeshResult } from '../../types/thermal';

interface ThermalChartProps {
  meshResult?: ThermalMeshResult;
  analyticalCurve?: AnalyticalCurveDTO;
  elements: number;
}

export const ThermalChart: React.FC<ThermalChartProps> = ({
  meshResult,
  analyticalCurve,
  elements
}) => {
  const [viewMode, setViewMode] = useState<'temperature' | 'error'>('temperature');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // SVG Dimensions & Margins
  const width = 720;
  const height = 360;
  const margin = { top: 30, right: 30, bottom: 50, left: 65 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Domain & Range for Temperature Mode
  const xMin = 0.0;
  const xMax = 1.0;
  const tMin = 0.0;
  const tMax = 200.0;

  // Coordinate transforms
  const scaleX = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const scaleYTemp = (t: number) => margin.top + (1 - (t - tMin) / (tMax - tMin)) * plotHeight;

  // Max error for Error Mode
  const maxErr = meshResult?.max_midpoint_error_C ?? 1.5;
  const errMaxY = Math.max(maxErr * 1.25, 0.025);
  const scaleYErr = (e: number) => margin.top + (1 - e / errMaxY) * plotHeight;

  // Generate SVG path for continuous analytical curve (201 C++ sampling points)
  let analyticalPathD = '';
  if (analyticalCurve && analyticalCurve.x_m && analyticalCurve.x_m.length > 0) {
    analyticalPathD = analyticalCurve.x_m.reduce((acc, x, i) => {
      const px = scaleX(x);
      const py = scaleYTemp(analyticalCurve.temperature_C[i]);
      return i === 0 ? `M ${px.toFixed(2)} ${py.toFixed(2)}` : `${acc} L ${px.toFixed(2)} ${py.toFixed(2)}`;
    }, '');
  }

  // Generate SVG path for piecewise-linear FEM segments
  let femPathD = '';
  if (meshResult && meshResult.x_m && meshResult.x_m.length > 0) {
    femPathD = meshResult.x_m.reduce((acc, x, i) => {
      const px = scaleX(x);
      const py = scaleYTemp(meshResult.fem_temperature_C[i]);
      return i === 0 ? `M ${px.toFixed(2)} ${py.toFixed(2)}` : `${acc} L ${px.toFixed(2)} ${py.toFixed(2)}`;
    }, '');
  }

  // Ticks
  const xTicks = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const tTicks = [0, 50, 100, 150, 200];
  const errTicks = [0, errMaxY * 0.25, errMaxY * 0.5, errMaxY * 0.75, errMaxY];

  return (
    <div style={{ backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid #333', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Chart Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
            {viewMode === 'temperature'
              ? `Temperature Distribution T(x) [N = ${elements} Elements]`
              : `Spatial Discretization Error Profile [N = ${elements} Elements]`}
          </h3>
          <span style={{ fontSize: '11px', color: '#888' }}>
            {viewMode === 'temperature'
              ? 'Continuous C++ analytical solution compared with piecewise-linear FEM nodal solution'
              : 'Midpoint interpolation error e_mid = |T_FEM - T_exact| across element spans'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setViewMode('temperature')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: viewMode === 'temperature' ? '#0e639c' : '#2d2d2d',
              color: viewMode === 'temperature' ? '#fff' : '#aaa',
              border: '1px solid #444',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Temperature Profile T(x)
          </button>
          <button
            onClick={() => setViewMode('error')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: viewMode === 'error' ? '#0e639c' : '#2d2d2d',
              color: viewMode === 'error' ? '#fff' : '#aaa',
              border: '1px solid #444',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Error Distribution e(x)
          </button>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div style={{ width: '100%', position: 'relative', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', maxHeight: '420px', display: 'block' }}
        >
          {/* Plot Background */}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="#141414"
            stroke="#333"
            strokeWidth="1"
          />

          {/* X Grid Lines */}
          {xTicks.map((tick) => (
            <line
              key={`x-grid-${tick}`}
              x1={scaleX(tick)}
              y1={margin.top}
              x2={scaleX(tick)}
              y2={margin.top + plotHeight}
              stroke="#252526"
              strokeDasharray="2,2"
            />
          ))}

          {/* Y Grid Lines */}
          {viewMode === 'temperature'
            ? tTicks.map((tick) => (
                <line
                  key={`y-grid-${tick}`}
                  x1={margin.left}
                  y1={scaleYTemp(tick)}
                  x2={margin.left + plotWidth}
                  y2={scaleYTemp(tick)}
                  stroke="#252526"
                  strokeDasharray="2,2"
                />
              ))
            : errTicks.map((tick, i) => (
                <line
                  key={`y-grid-err-${i}`}
                  x1={margin.left}
                  y1={scaleYErr(tick)}
                  x2={margin.left + plotWidth}
                  y2={scaleYErr(tick)}
                  stroke="#252526"
                  strokeDasharray="2,2"
                />
              ))}

          {/* Axes Lines */}
          <line
            x1={margin.left}
            y1={margin.top + plotHeight}
            x2={margin.left + plotWidth}
            y2={margin.top + plotHeight}
            stroke="#666"
            strokeWidth="1"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + plotHeight}
            stroke="#666"
            strokeWidth="1"
          />

          {/* X Axis Ticks & Labels */}
          {xTicks.map((tick) => {
            const px = scaleX(tick);
            return (
              <g key={`x-tick-${tick}`}>
                <line x1={px} y1={margin.top + plotHeight} x2={px} y2={margin.top + plotHeight + 5} stroke="#888" />
                <text
                  x={px}
                  y={margin.top + plotHeight + 20}
                  fill="#aaa"
                  fontSize="11"
                  textAnchor="middle"
                  fontFamily="Segoe UI, sans-serif"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}
          <text
            x={margin.left + plotWidth / 2}
            y={height - 12}
            fill="#ddd"
            fontSize="12"
            fontWeight="500"
            textAnchor="middle"
            fontFamily="Segoe UI, sans-serif"
          >
            Position x (m)
          </text>

          {/* Y Axis Ticks & Labels */}
          {viewMode === 'temperature' ? (
            <>
              {tTicks.map((tick) => {
                const py = scaleYTemp(tick);
                return (
                  <g key={`y-tick-${tick}`}>
                    <line x1={margin.left - 5} y1={py} x2={margin.left} y2={py} stroke="#888" />
                    <text
                      x={margin.left - 10}
                      y={py + 4}
                      fill="#aaa"
                      fontSize="11"
                      textAnchor="end"
                      fontFamily="Segoe UI, sans-serif"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}
              <text
                transform={`rotate(-90)`}
                x={-(margin.top + plotHeight / 2)}
                y={18}
                fill="#ddd"
                fontSize="12"
                fontWeight="500"
                textAnchor="middle"
                fontFamily="Segoe UI, sans-serif"
              >
                Temperature T (°C)
              </text>
            </>
          ) : (
            <>
              {errTicks.map((tick, i) => {
                const py = scaleYErr(tick);
                return (
                  <g key={`y-tick-err-${i}`}>
                    <line x1={margin.left - 5} y1={py} x2={margin.left} y2={py} stroke="#888" />
                    <text
                      x={margin.left - 10}
                      y={py + 4}
                      fill="#aaa"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="Segoe UI, sans-serif"
                    >
                      {tick.toFixed(tick < 0.1 ? 4 : 2)}
                    </text>
                  </g>
                );
              })}
              <text
                transform={`rotate(-90)`}
                x={-(margin.top + plotHeight / 2)}
                y={18}
                fill="#ff8787"
                fontSize="12"
                fontWeight="500"
                textAnchor="middle"
                fontFamily="Segoe UI, sans-serif"
              >
                Midpoint Error (°C)
              </text>
            </>
          )}

          {/* Curves & Points Rendering */}
          {viewMode === 'temperature' ? (
            <>
              {/* Continuous Analytical Solution Curve (C++ 201 samples) */}
              {analyticalPathD && (
                <path
                  d={analyticalPathD}
                  fill="none"
                  stroke="#ffa94d"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Piecewise-linear FEM Segments */}
              {femPathD && (
                <path
                  d={femPathD}
                  fill="none"
                  stroke="#38d9a9"
                  strokeWidth="1.75"
                  strokeDasharray="4,2"
                />
              )}

              {/* Analytical Peak Marker: (x=0.42 m, T=188.20 °C) */}
              <circle
                cx={scaleX(0.42)}
                cy={scaleYTemp(188.2)}
                r="4.5"
                fill="#ffd43b"
                stroke="#fff"
                strokeWidth="1"
              />
              <text
                x={scaleX(0.42)}
                y={scaleYTemp(188.2) - 10}
                fill="#ffd43b"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                Peak: 188.20 °C
              </text>

              {/* Discrete FEM Nodal Points */}
              {meshResult &&
                meshResult.x_m.map((x, i) => {
                  const px = scaleX(x);
                  const py = scaleYTemp(meshResult.fem_temperature_C[i]);
                  const isHovered = hoverIndex === i;
                  return (
                    <circle
                      key={`fem-node-${i}`}
                      cx={px}
                      cy={py}
                      r={isHovered ? 6 : 3}
                      fill={isHovered ? '#ff6b6b' : '#20c997'}
                      stroke="#141414"
                      strokeWidth="1"
                      style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                      onMouseEnter={() => setHoverIndex(i)}
                      onMouseLeave={() => setHoverIndex(null)}
                    />
                  );
                })}
            </>
          ) : (
            <>
              {/* Error Mode: Element Midpoint Errors */}
              {meshResult &&
                meshResult.midpoints.map((mid) => {
                  const px = scaleX(mid.x_mid_m);
                  const py = scaleYErr(mid.error_C);
                  return (
                    <g key={`mid-err-${mid.element_id}`}>
                      {/* Vertical stem from zero */}
                      <line
                        x1={px}
                        y1={scaleYErr(0)}
                        x2={px}
                        y2={py}
                        stroke="#ff6b6b"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                      />
                      <circle
                        cx={px}
                        cy={py}
                        r="3.5"
                        fill="#ff8787"
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}
              {/* Theoretical Constant Error Line */}
              {meshResult && (
                <line
                  x1={margin.left}
                  y1={scaleYErr(meshResult.theoretical_midpoint_error_C)}
                  x2={margin.left + plotWidth}
                  y2={scaleYErr(meshResult.theoretical_midpoint_error_C)}
                  stroke="#ffd43b"
                  strokeWidth="1.5"
                  strokeDasharray="5,3"
                />
              )}
            </>
          )}

          {/* Interactive Tooltip Card */}
          {hoverIndex !== null && meshResult && meshResult.x_m[hoverIndex] !== undefined && (
            <g
              transform={`translate(${Math.min(
                scaleX(meshResult.x_m[hoverIndex]) + 15,
                width - 180
              )}, ${Math.max(scaleYTemp(meshResult.fem_temperature_C[hoverIndex]) - 40, margin.top + 10)})`}
            >
              <rect width="160" height="75" rx="4" fill="#252526" stroke="#4dabf7" strokeWidth="1" opacity="0.95" />
              <text x="10" y="18" fill="#4dabf7" fontSize="11" fontWeight="600">
                Node #{hoverIndex} (x = {meshResult.x_m[hoverIndex].toFixed(4)} m)
              </text>
              <text x="10" y="34" fill="#eee" fontSize="11">
                FEM Temp: {meshResult.fem_temperature_C[hoverIndex].toFixed(2)} °C
              </text>
              <text x="10" y="50" fill="#ffa94d" fontSize="11">
                Exact Temp: {meshResult.analytical_temperature_C[hoverIndex].toFixed(2)} °C
              </text>
              <text x="10" y="66" fill="#69db7c" fontSize="11">
                Nodal Error: {meshResult.nodal_error_C[hoverIndex].toExponential(2)} °C
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend & Summary Info */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '11px', color: '#ccc', borderTop: '1px solid #333', paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '3px', backgroundColor: '#ffa94d' }} />
          <span>Continuous Analytical Solution: T(x) = 100 + 420x - 500x² °C</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '2px', backgroundColor: '#38d9a9', borderTop: '2px dashed #38d9a9' }} />
          <span>Piecewise-Linear FEM Segments (N = {elements})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#20c997' }} />
          <span>Discrete FEM Nodal Values</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffd43b' }} />
          <span>Analytical Peak (188.20 °C at x = 0.42 m)</span>
        </div>
      </div>
    </div>
  );
};
