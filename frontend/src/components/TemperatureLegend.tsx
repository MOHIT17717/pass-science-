import React from 'react';

interface TemperatureLegendProps {
  minTemp: number;
  maxTemp: number;
  avgTemp?: number;
}

export const TemperatureLegend: React.FC<TemperatureLegendProps> = ({ minTemp, maxTemp, avgTemp }) => {
  const midTemp = (minTemp + maxTemp) / 2;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: 'rgba(26, 26, 26, 0.9)',
        border: '1px solid #444',
        borderRadius: '6px',
        padding: '12px 16px',
        color: '#e0e0e0',
        fontSize: '11px',
        fontFamily: 'Segoe UI, sans-serif',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        zIndex: 10,
        pointerEvents: 'auto'
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '8px', color: '#fff', fontSize: '12px' }}>
        Temperature Legend (°C)
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Color bar */}
        <div
          style={{
            width: '16px',
            height: '140px',
            borderRadius: '3px',
            border: '1px solid #555',
            background: 'linear-gradient(to bottom, #d73027, #f46d43, #fdae61, #fee08b, #ffffbf, #d9ef8b, #a6d96a, #66bd63, #1a9850, #4575b4)'
          }}
        />
        {/* Value labels */}
        <div
          style={{
            height: '140px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'Consolas, monospace',
            fontSize: '11px'
          }}
        >
          <div>
            <span style={{ fontWeight: 'bold', color: '#ff6b6b' }}>{maxTemp.toFixed(1)} °C</span> (Max)
          </div>
          {avgTemp !== undefined && (
            <div style={{ color: '#aaa' }}>
              <span>{avgTemp.toFixed(1)} °C</span> (Avg)
            </div>
          )}
          <div style={{ color: '#aaa' }}>
            <span>{midTemp.toFixed(1)} °C</span> (Mid)
          </div>
          <div>
            <span style={{ fontWeight: 'bold', color: '#4dabf7' }}>{minTemp.toFixed(1)} °C</span> (Min)
          </div>
        </div>
      </div>
    </div>
  );
};
