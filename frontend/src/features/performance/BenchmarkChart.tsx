import React, { useState } from 'react';
import type { WorkerBenchmarkResultDTO } from '../../types/benchmark';

interface BenchmarkChartProps {
  results: WorkerBenchmarkResultDTO[];
}

export const BenchmarkChart: React.FC<BenchmarkChartProps> = ({ results }) => {
  const [activeMetric, setActiveMetric] = useState<'speedup' | 'efficiency'>('speedup');
  const [hoveredWorker, setHoveredWorker] = useState<WorkerBenchmarkResultDTO | null>(null);

  if (!results || results.length === 0) {
    return null;
  }

  // Dimensions
  const width = 640;
  const height = 300;
  const margin = { top: 28, right: 36, bottom: 48, left: 56 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // X Scaling: Worker count from 1 to max(workers)
  const maxWorker = Math.max(...results.map((r) => r.worker_count), 4);
  const minWorker = 1;
  const scaleX = (w: number) =>
    margin.left + ((w - minWorker) / (maxWorker - minWorker)) * plotWidth;

  // Y Scaling
  // Speedup: from 0 to maxWorker * 1.15
  const maxSpeedupY = Math.max(maxWorker * 1.1, 4.5);
  const scaleYSpeedup = (s: number) =>
    margin.top + (1 - s / maxSpeedupY) * plotHeight;

  // Efficiency: from 0% to 120%
  const scaleYEfficiency = (eff: number) =>
    margin.top + (1 - eff / 1.2) * plotHeight;

  // Grid Ticks
  const workerTicks = [1, 2, 3, 4].filter((w) => w <= maxWorker);
  const speedupTicks = [0, 1, 2, 3, 4];
  const efficiencyTicks = [0.0, 0.25, 0.5, 0.75, 1.0, 1.2];

  // Path Builders
  // Ideal linear speedup: (1, 1) to (maxWorker, maxWorker)
  const idealSpeedupD = `M ${scaleX(1)} ${scaleYSpeedup(1)} L ${scaleX(maxWorker)} ${scaleYSpeedup(maxWorker)}`;

  // Measured speedup path
  const measuredSpeedupD = results.reduce((acc, r, i) => {
    const px = scaleX(r.worker_count);
    const py = scaleYSpeedup(r.speedup);
    return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
  }, '');

  // Ideal 100% efficiency: y = 1.0
  const idealEfficiencyD = `M ${scaleX(1)} ${scaleYEfficiency(1.0)} L ${scaleX(maxWorker)} ${scaleYEfficiency(1.0)}`;

  // Measured efficiency path
  const measuredEfficiencyD = results.reduce((acc, r, i) => {
    const px = scaleX(r.worker_count);
    const py = scaleYEfficiency(r.efficiency);
    return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
  }, '');

  return (
    <div style={{ backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid #333', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Chart Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
            {activeMetric === 'speedup'
              ? 'Multicore Scaling: Measured Speedup vs. Ideal Linear Speedup'
              : 'Multicore Parallel Efficiency: Observed Scaling vs. 100% Ideal'}
          </h3>
          <span style={{ fontSize: '11px', color: '#888' }}>
            {activeMetric === 'speedup'
              ? 'Speedup S_p = T_1 / T_p | Evaluated over 5 measured repetitions (median)'
              : 'Parallel Efficiency E_p = S_p / p | Reflects core scaling and Amdahl\'s Law'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveMetric('speedup')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: activeMetric === 'speedup' ? '#0e639c' : '#2d2d2d',
              color: activeMetric === 'speedup' ? '#fff' : '#aaa',
              border: '1px solid #444',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Speedup (S_p)
          </button>
          <button
            onClick={() => setActiveMetric('efficiency')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: activeMetric === 'efficiency' ? '#0e639c' : '#2d2d2d',
              color: activeMetric === 'efficiency' ? '#fff' : '#aaa',
              border: '1px solid #444',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Efficiency (E_p)
          </button>
        </div>
      </div>

      {/* SVG Plot */}
      <div style={{ width: '100%', position: 'relative', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', maxHeight: '320px', display: 'block' }}
        >
          {/* Plot Canvas */}
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
          {workerTicks.map((w) => (
            <line
              key={`x-grid-${w}`}
              x1={scaleX(w)}
              y1={margin.top}
              x2={scaleX(w)}
              y2={margin.top + plotHeight}
              stroke="#252526"
              strokeDasharray="2 2"
            />
          ))}

          {/* Y Grid Lines */}
          {activeMetric === 'speedup'
            ? speedupTicks.map((s) => (
                <line
                  key={`y-grid-s-${s}`}
                  x1={margin.left}
                  y1={scaleYSpeedup(s)}
                  x2={margin.left + plotWidth}
                  y2={scaleYSpeedup(s)}
                  stroke="#252526"
                  strokeDasharray="2 2"
                />
              ))
            : efficiencyTicks.map((eff, i) => (
                <line
                  key={`y-grid-eff-${i}`}
                  x1={margin.left}
                  y1={scaleYEfficiency(eff)}
                  x2={margin.left + plotWidth}
                  y2={scaleYEfficiency(eff)}
                  stroke="#252526"
                  strokeDasharray="2 2"
                />
              ))}

          {/* X Axis Labels */}
          {workerTicks.map((w) => (
            <g key={`x-lbl-${w}`}>
              <line
                x1={scaleX(w)}
                y1={margin.top + plotHeight}
                x2={scaleX(w)}
                y2={margin.top + plotHeight + 5}
                stroke="#666"
              />
              <text
                x={scaleX(w)}
                y={margin.top + plotHeight + 18}
                fill="#aaa"
                fontSize="11"
                textAnchor="middle"
                fontFamily="Segoe UI, sans-serif"
              >
                {w} {w === 1 ? 'Worker (Serial)' : 'Workers'}
              </text>
            </g>
          ))}
          <text
            x={margin.left + plotWidth / 2}
            y={height - 8}
            fill="#ddd"
            fontSize="12"
            fontWeight="500"
            textAnchor="middle"
            fontFamily="Segoe UI, sans-serif"
          >
            Worker Count (p)
          </text>

          {/* Y Axis Labels */}
          {activeMetric === 'speedup' ? (
            <>
              {speedupTicks.map((s) => (
                <g key={`y-lbl-s-${s}`}>
                  <line
                    x1={margin.left - 5}
                    y1={scaleYSpeedup(s)}
                    x2={margin.left}
                    y2={scaleYSpeedup(s)}
                    stroke="#666"
                  />
                  <text
                    x={margin.left - 8}
                    y={scaleYSpeedup(s) + 4}
                    fill="#aaa"
                    fontSize="11"
                    textAnchor="end"
                    fontFamily="Segoe UI, sans-serif"
                  >
                    {s}.0x
                  </text>
                </g>
              ))}
              <text
                transform="rotate(-90)"
                x={-(margin.top + plotHeight / 2)}
                y={18}
                fill="#38d9a9"
                fontSize="12"
                fontWeight="500"
                textAnchor="middle"
                fontFamily="Segoe UI, sans-serif"
              >
                Speedup (S_p)
              </text>

              {/* Ideal Linear Speedup Reference Line */}
              <path
                d={idealSpeedupD}
                fill="none"
                stroke="#555"
                strokeWidth="1.75"
                strokeDasharray="4 3"
              />

              {/* Measured Speedup Curve */}
              <path
                d={measuredSpeedupD}
                fill="none"
                stroke="#38d9a9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              {results.map((r) => {
                const px = scaleX(r.worker_count);
                const py = scaleYSpeedup(r.speedup);
                const isHovered = hoveredWorker?.worker_count === r.worker_count;
                return (
                  <circle
                    key={`pt-s-${r.worker_count}`}
                    cx={px}
                    cy={py}
                    r={isHovered ? 6 : 4.5}
                    fill={isHovered ? '#ffd43b' : '#38d9a9'}
                    stroke="#141414"
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredWorker(r)}
                    onMouseLeave={() => setHoveredWorker(null)}
                  />
                );
              })}
            </>
          ) : (
            <>
              {efficiencyTicks.map((eff, i) => (
                <g key={`y-lbl-eff-${i}`}>
                  <line
                    x1={margin.left - 5}
                    y1={scaleYEfficiency(eff)}
                    x2={margin.left}
                    y2={scaleYEfficiency(eff)}
                    stroke="#666"
                  />
                  <text
                    x={margin.left - 8}
                    y={scaleYEfficiency(eff) + 4}
                    fill="#aaa"
                    fontSize="11"
                    textAnchor="end"
                    fontFamily="Segoe UI, sans-serif"
                  >
                    {Math.round(eff * 100)}%
                  </text>
                </g>
              ))}
              <text
                transform="rotate(-90)"
                x={-(margin.top + plotHeight / 2)}
                y={18}
                fill="#ffa94d"
                fontSize="12"
                fontWeight="500"
                textAnchor="middle"
                fontFamily="Segoe UI, sans-serif"
              >
                Parallel Efficiency (E_p)
              </text>

              {/* Ideal 100% Efficiency Reference Line */}
              <path
                d={idealEfficiencyD}
                fill="none"
                stroke="#555"
                strokeWidth="1.75"
                strokeDasharray="4 3"
              />

              {/* Measured Efficiency Curve */}
              <path
                d={measuredEfficiencyD}
                fill="none"
                stroke="#ffa94d"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              {results.map((r) => {
                const px = scaleX(r.worker_count);
                const py = scaleYEfficiency(r.efficiency);
                const isHovered = hoveredWorker?.worker_count === r.worker_count;
                return (
                  <circle
                    key={`pt-eff-${r.worker_count}`}
                    cx={px}
                    cy={py}
                    r={isHovered ? 6 : 4.5}
                    fill={isHovered ? '#ffd43b' : '#ffa94d'}
                    stroke="#141414"
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredWorker(r)}
                    onMouseLeave={() => setHoveredWorker(null)}
                  />
                );
              })}
            </>
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoveredWorker && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              backgroundColor: '#252526',
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '11px',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              pointerEvents: 'none'
            }}
          >
            <div>
              <strong>{hoveredWorker.worker_count} {hoveredWorker.worker_count === 1 ? 'Worker (Serial)' : 'Workers (Parallel)'}</strong>
            </div>
            <div style={{ color: '#aaa', marginTop: '4px' }}>
              Median: <span style={{ color: '#fff', fontFamily: 'monospace' }}>{hoveredWorker.median_ms.toFixed(2)} ms</span>
            </div>
            <div style={{ color: '#38d9a9' }}>
              Speedup: <span style={{ fontFamily: 'monospace' }}>{hoveredWorker.speedup.toFixed(2)}x</span>
            </div>
            <div style={{ color: '#ffa94d' }}>
              Efficiency: <span style={{ fontFamily: 'monospace' }}>{(hoveredWorker.efficiency * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: '#aaa', justifyContent: 'center', paddingTop: '4px', borderTop: '1px solid #2a2a2a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '2px', backgroundColor: '#555', borderTop: '2px dashed #555' }} />
          <span>Ideal {activeMetric === 'speedup' ? 'Linear Speedup (S_p = p)' : '100% Efficiency (E_p = 1.0)'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '3px', backgroundColor: activeMetric === 'speedup' ? '#38d9a9' : '#ffa94d' }} />
          <span>Measured {activeMetric === 'speedup' ? 'Speedup' : 'Efficiency'} (Median of 5 runs)</span>
        </div>
      </div>
    </div>
  );
};
