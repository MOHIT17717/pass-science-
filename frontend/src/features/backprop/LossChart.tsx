import React, { useState } from 'react';
import type { TrainingRecord } from '../../types/backprop';

interface LossChartProps {
  history: TrainingRecord[];
  width?: number;
  height?: number;
}

export const LossChart: React.FC<LossChartProps> = ({
  history,
  width = 720,
  height = 300
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!history || history.length === 0) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '12px' }}>
        No training history available. Run backpropagation training to visualize the loss curve.
      </div>
    );
  }

  const padding = { top: 25, right: 30, bottom: 45, left: 65 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxStep = history[history.length - 1].step || 100;
  const maxLoss = 1.25; // J0 is ~1.1825, so 1.25 provides headroom

  const getX = (step: number) => padding.left + (step / maxStep) * innerWidth;
  const getY = (loss: number) => padding.top + innerHeight - (Math.max(0, Math.min(loss, maxLoss)) / maxLoss) * innerHeight;

  // Build SVG path for loss
  const points = history.map((rec) => `${getX(rec.step).toFixed(1)},${getY(rec.loss).toFixed(1)}`).join(' L ');
  const linePath = `M ${points}`;
  const areaPath = `M ${points} L ${getX(history[history.length - 1].step).toFixed(1)},${padding.top + innerHeight} L ${padding.left},${padding.top + innerHeight} Z`;

  // Horizontal grid lines
  const yTicks = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2];
  // Vertical grid lines
  const xTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const hoveredRecord = hoveredIndex !== null && history[hoveredIndex] ? history[hoveredIndex] : null;

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto', backgroundColor: '#181818', borderRadius: '6px', border: '1px solid #282828', padding: '8px' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4dabf7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4dabf7" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line x1={padding.left} y1={y} x2={padding.left + innerWidth} y2={y} stroke="#2a2a2a" strokeWidth="1" strokeDasharray="3 3" />
              <text x={padding.left - 10} y={y + 4} fill="#777" fontSize="10" textAnchor="end">
                {tick.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Vertical grid lines */}
        {xTicks.map((tick) => {
          const x = getX(tick);
          return (
            <g key={tick}>
              <line x1={x} y1={padding.top} x2={x} y2={padding.top + innerHeight} stroke="#2a2a2a" strokeWidth="1" strokeDasharray="3 3" />
              <text x={x} y={padding.top + innerHeight + 16} fill="#777" fontSize="10" textAnchor="middle">
                {tick}
              </text>
            </g>
          );
        })}

        {/* Axis borders */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} stroke="#444" strokeWidth="1" />
        <line x1={padding.left} y1={padding.top + innerHeight} x2={padding.left + innerWidth} y2={padding.top + innerHeight} stroke="#444" strokeWidth="1" />

        {/* Axis titles */}
        <text
          x={padding.left + innerWidth / 2}
          y={height - 8}
          fill="#aaa"
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
        >
          Training Step (k ∈ [0, 100])
        </text>

        <text
          x={14}
          y={padding.top + innerHeight / 2}
          fill="#aaa"
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          transform={`rotate(-90, 14, ${padding.top + innerHeight / 2})`}
        >
          Loss J = ½ (y - ŷ)²
        </text>

        {/* Area fill */}
        <path d={areaPath} fill="url(#lossGradient)" />

        {/* Loss curve path */}
        <path d={linePath} fill="none" stroke="#339af0" strokeWidth="2.5" />

        {/* Highlight Step 0 & Step 1 */}
        {history.length > 0 && (
          <g>
            <circle cx={getX(history[0].step)} cy={getY(history[0].loss)} r="4" fill="#ff6b6b" stroke="#fff" strokeWidth="1.5" />
            <text x={getX(history[0].step) + 8} y={getY(history[0].loss) + 4} fill="#ff6b6b" fontSize="10" fontWeight="bold">
              J₀ = {history[0].loss.toFixed(4)}
            </text>
          </g>
        )}

        {history.length > 1 && (
          <g>
            <circle cx={getX(history[1].step)} cy={getY(history[1].loss)} r="4" fill="#ffd43b" stroke="#fff" strokeWidth="1.5" />
            <text x={getX(history[1].step) + 8} y={getY(history[1].loss) + 4} fill="#ffd43b" fontSize="10" fontWeight="bold">
              J₁ = {history[1].loss.toFixed(4)} (-42%)
            </text>
          </g>
        )}

        {/* Interactive hover overlay elements */}
        {history.map((rec, idx) => {
          const cx = getX(rec.step);
          const cy = getY(rec.loss);
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={hoveredIndex === idx ? 5 : 3}
              fill={hoveredIndex === idx ? '#fff' : '#339af0'}
              stroke="#181818"
              strokeWidth="1"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredIndex(idx)}
            />
          );
        })}

        {/* Active hover vertical crosshair */}
        {hoveredRecord && (
          <line
            x1={getX(hoveredRecord.step)}
            y1={padding.top}
            x2={getX(hoveredRecord.step)}
            y2={padding.top + innerHeight}
            stroke="#fff"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.6"
          />
        )}
      </svg>

      {/* Hover Info Tooltip Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', padding: '6px 12px', backgroundColor: '#202020', borderRadius: '4px', fontSize: '11px' }}>
        <div>
          {hoveredRecord ? (
            <span>
              Step <strong>{hoveredRecord.step}</strong>: Loss J = <strong style={{ color: '#4dabf7' }}>{hoveredRecord.loss.toFixed(6)}</strong> | Prediction ŷ = <strong style={{ color: '#69db7c' }}>{hoveredRecord.y_hat.toFixed(6)}</strong> (Target y = 2.0)
            </span>
          ) : (
            <span style={{ color: '#888' }}>
              Hover over any data point to inspect step loss, prediction ŷ, and parameters.
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '14px', fontSize: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff6b6b' }} /> Step 0 (Initial)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffd43b' }} /> Step 1 (Updated)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#339af0' }} /> Monotonic Descent (Steps 2..100)
          </span>
        </div>
      </div>
    </div>
  );
};
