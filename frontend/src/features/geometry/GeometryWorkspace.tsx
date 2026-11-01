import React, { useState, useRef } from 'react';
import type { StlModelData, GeometryViewOptions } from '../../types/geometry';

interface GeometryWorkspaceProps {
  modelData: StlModelData | null;
  options: GeometryViewOptions;
  onOptionsChange: (options: GeometryViewOptions) => void;
  onModelLoaded: (data: StlModelData, filename: string) => void;
  onClear: () => void;
}

export const GeometryWorkspace: React.FC<GeometryWorkspaceProps> = ({
  modelData,
  options,
  onOptionsChange,
  onModelLoaded,
  onClear
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processStlContent = async (content: string, filename: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!window.workbenchAPI) {
        throw new Error('Workbench API is not available.');
      }
      const res = await window.workbenchAPI.parseStl(content);
      if (res.status === 'ok') {
        setCurrentFilename(filename);
        onModelLoaded(res, filename);
      } else {
        setErrorMsg(res.error || 'Failed to parse STL geometry.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during STL parsing.');
    } finally {
      setLoading(false);
    }
  };

  const handleNativeOpen = async () => {
    if (!window.workbenchAPI) return;
    try {
      const file = await window.workbenchAPI.openFileDialog('stl');
      if (file) {
        await processStlContent(file.content, file.filename);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleLoadSample = async () => {
    if (!window.workbenchAPI) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const sample = await window.workbenchAPI.loadSample('stl');
      await processStlContent(sample.content, sample.filename);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await processStlContent(text, file.name);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const text = await file.text();
    await processStlContent(text, file.name);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#ddd' }}>
      {/* Import Section */}
      <div style={{ backgroundColor: '#252526', padding: '16px', borderRadius: '6px', border: '1px solid #333' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>1. ASCII STL CAD Import</span>
          {modelData && (
            <button
              onClick={() => {
                setCurrentFilename(null);
                onClear();
              }}
              style={{
                backgroundColor: 'transparent',
                color: '#ff6b6b',
                border: '1px solid #ff6b6b',
                borderRadius: '3px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Clear Model
            </button>
          )}
        </h3>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragOver ? '#0e639c' : '#444'}`,
            borderRadius: '6px',
            padding: '20px 16px',
            textAlign: 'center',
            backgroundColor: isDragOver ? 'rgba(14, 99, 156, 0.1)' : '#1e1e1e',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '12px'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".stl"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0', marginBottom: '4px' }}>
            Click or Drop ASCII STL file here
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            Supports standard ASCII .stl files up to 10 MB (max 50,000 triangles)
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleNativeOpen}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#0e639c',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            {loading ? 'Processing...' : 'Browse STL File...'}
          </button>
          <button
            onClick={handleLoadSample}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#333333',
              color: '#4dabf7',
              border: '1px solid #4dabf7',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            Load Sample Bracket
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: '#441414',
            border: '1px solid #ff4d4f',
            borderRadius: '6px',
            padding: '12px 14px',
            color: '#ffc1c1',
            fontSize: '12px',
            lineHeight: 1.4
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px', color: '#ff7875' }}>
            CAD Parsing Rejection
          </div>
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Model Metadata Card */}
      {modelData && modelData.status === 'ok' && (
        <div style={{ backgroundColor: '#252526', padding: '16px', borderRadius: '6px', border: '1px solid #333' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#4dabf7' }}>
            Loaded Model Metadata
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
              <span style={{ color: '#888' }}>File:</span>
              <span style={{ fontFamily: 'Consolas, monospace', color: '#fff' }}>{currentFilename || 'in-memory.stl'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
              <span style={{ color: '#888' }}>Solid Name:</span>
              <span style={{ fontWeight: 500 }}>{modelData.solid_name || 'unnamed'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
              <span style={{ color: '#888' }}>Triangle Count:</span>
              <span style={{ fontWeight: 600, color: '#69db7c' }}>{modelData.triangle_count?.toLocaleString()} facets</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
              <span style={{ color: '#888' }}>Vertex Count:</span>
              <span>{((modelData.triangle_count || 0) * 3).toLocaleString()} vertices</span>
            </div>
            {modelData.bbox && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
                  <span style={{ color: '#888' }}>Dimensions (dx, dy, dz):</span>
                  <span style={{ fontFamily: 'Consolas, monospace' }}>
                    {(modelData.bbox.dimensions[0] * 1000).toFixed(1)} x {(modelData.bbox.dimensions[1] * 1000).toFixed(1)} x {(modelData.bbox.dimensions[2] * 1000).toFixed(1)} mm
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
                  <span style={{ color: '#888' }}>Bounding Extents (m):</span>
                  <span style={{ fontFamily: 'Consolas, monospace', fontSize: '11px' }}>
                    [{modelData.bbox.min.map((v) => v.toFixed(3)).join(', ')}] to [{modelData.bbox.max.map((v) => v.toFixed(3)).join(', ')}]
                  </span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Normals Policy:</span>
              <span style={{ fontSize: '11px', color: (modelData.normals_recomputed_count || 0) > 0 ? '#ffd43b' : '#69db7c' }}>
                {(modelData.normals_recomputed_count || 0) > 0
                  ? `${modelData.normals_recomputed_count} normals recomputed`
                  : 'Authored normals preserved'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Controls */}
      <div style={{ backgroundColor: '#252526', padding: '16px', borderRadius: '6px', border: '1px solid #333' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#fff' }}>
          3D View & Shader Controls
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.showSurface}
              onChange={(e) => onOptionsChange({ ...options, showSurface: e.target.checked })}
            />
            <span>Render CAD Surface Mesh</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.wireframe}
              onChange={(e) => onOptionsChange({ ...options, wireframe: e.target.checked })}
            />
            <span>Show Facet Wireframe Overlay</span>
          </label>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#888' }}>Surface Opacity:</span>
              <span>{Math.round(options.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={options.opacity}
              onChange={(e) => onOptionsChange({ ...options, opacity: parseFloat(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
