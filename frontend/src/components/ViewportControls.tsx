import React from 'react';

interface ViewportControlsProps {
  onCameraPreset: (preset: 'fit' | 'top' | 'front' | 'side' | 'iso') => void;
  hasGeometry: boolean;
  hasTemperature: boolean;
}

export const ViewportControls: React.FC<ViewportControlsProps> = ({
  onCameraPreset,
  hasGeometry,
  hasTemperature
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(26, 26, 26, 0.85)',
        border: '1px solid #444',
        borderRadius: '6px',
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        zIndex: 10,
        pointerEvents: 'auto'
      }}
    >
      <button
        onClick={() => onCameraPreset('fit')}
        title="Frame camera to fit all loaded objects"
        style={{
          padding: '4px 8px',
          backgroundColor: '#0e639c',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 600
        }}
      >
        Fit View
      </button>
      <div style={{ width: '1px', height: '16px', backgroundColor: '#555', margin: '0 2px' }} />
      {(['iso', 'top', 'front', 'side'] as const).map((preset) => (
        <button
          key={preset}
          onClick={() => onCameraPreset(preset)}
          title={`Switch camera to ${preset.toUpperCase()} view`}
          style={{
            padding: '4px 8px',
            backgroundColor: '#333',
            color: '#ddd',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            textTransform: 'uppercase'
          }}
        >
          {preset}
        </button>
      ))}
      <div style={{ width: '1px', height: '16px', backgroundColor: '#555', margin: '0 2px' }} />
      <div style={{ fontSize: '10px', color: '#888', display: 'flex', gap: '6px', paddingLeft: '4px' }}>
        <span style={{ color: hasGeometry ? '#4dabf7' : '#555' }}>CAD {hasGeometry ? '●' : '○'}</span>
        <span style={{ color: hasTemperature ? '#69db7c' : '#555' }}>TEMP {hasTemperature ? '●' : '○'}</span>
      </div>
    </div>
  );
};
