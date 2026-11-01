import React, { useState, useRef } from 'react';
import type { TemperatureDatasetData, TemperatureViewOptions, InspectedNode } from '../../types/temperature';

interface TemperatureWorkspaceProps {
  datasetData: TemperatureDatasetData | null;
  options: TemperatureViewOptions;
  onOptionsChange: (options: TemperatureViewOptions) => void;
  onDatasetLoaded: (data: TemperatureDatasetData, filename: string) => void;
  inspectedNode: InspectedNode | null;
  hasCadModel: boolean;
  onClear: () => void;
}

export const TemperatureWorkspace: React.FC<TemperatureWorkspaceProps> = ({
  datasetData,
  options,
  onOptionsChange,
  onDatasetLoaded,
  inspectedNode,
  hasCadModel,
  onClear
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processCsvContent = async (content: string, filename: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!window.workbenchAPI) {
        throw new Error('Workbench API is not available.');
      }
      const res = await window.workbenchAPI.parseCsv(content);
      if (res.status === 'ok') {
        setCurrentFilename(filename);
        onDatasetLoaded(res, filename);
      } else {
        setErrorMsg(res.error || 'Failed to parse temperature CSV.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during CSV parsing.');
    } finally {
      setLoading(false);
    }
  };

  const handleNativeOpen = async () => {
    if (!window.workbenchAPI) return;
    try {
      const file = await window.workbenchAPI.openFileDialog('csv');
      if (file) {
        await processCsvContent(file.content, file.filename);
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
      const sample = await window.workbenchAPI.loadSample('csv');
      await processCsvContent(sample.content, sample.filename);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await processCsvContent(text, file.name);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const text = await file.text();
    await processCsvContent(text, file.name);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#ddd' }}>
      {/* Import Section */}
      <div style={{ backgroundColor: '#252526', padding: '16px', borderRadius: '6px', border: '1px solid #333' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>2. Temperature CSV Import</span>
          {datasetData && (
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
              Clear Dataset
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
            accept=".csv"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0', marginBottom: '4px' }}>
            Click or Drop Temperature CSV file here
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            Schema: node_id,x_m,y_m,z_m,temperature_C (max 100,000 rows, 10 MB)
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
            {loading ? 'Processing...' : 'Browse CSV File...'}
          </button>
          <button
            onClick={handleLoadSample}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#333333',
              color: '#69db7c',
              border: '1px solid #69db7c',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            Load Synthetic ANSYS Grid
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
            CSV Parsing Rejection
          </div>
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Synthetic Provenance Disclaimer Badge */}
      {datasetData && datasetData.is_synthetic && (
        <div
          style={{
            backgroundColor: '#2d2200',
            border: '1px solid #e59900',
            borderRadius: '6px',
            padding: '10px 12px',
            color: '#ffe066',
            fontSize: '11px',
            lineHeight: 1.4
          }}
        >
          <strong style={{ color: '#ffd43b', display: 'block', marginBottom: '2px' }}>
            DISCLAIMER: SYNTHETIC VALIDATION DATASET
          </strong>
          This dataset was generated numerically from an analytical 3D thermal distribution model. It is <strong>NOT</strong> an actual ANSYS export.
        </div>
      )}

      {/* Inspected Node Card */}
      <div style={{ backgroundColor: '#252526', padding: '16px', borderRadius: '6px', border: '1px solid #333' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#ffd43b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Interactive Node Inspection</span>
          {inspectedNode && <span style={{ fontSize: '11px', color: '#aaa' }}>Node #{inspectedNode.nodeId}</span>}
        </h4>
        {inspectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', backgroundColor: '#1e1e1e', padding: '10px', borderRadius: '4px', border: '1px solid #444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
              <span style={{ color: '#888' }}>Node ID:</span>
              <span style={{ fontWeight: 'bold', color: '#fff' }}>#{inspectedNode.nodeId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
              <span style={{ color: '#888' }}>Coordinates (X, Y, Z):</span>
              <span style={{ fontFamily: 'Consolas, monospace', color: '#e0e0e0' }}>
                ({inspectedNode.x.toFixed(4)}, {inspectedNode.y.toFixed(4)}, {inspectedNode.z.toFixed(4)}) m
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
              <span style={{ color: '#888' }}>Coordinates (mm):</span>
              <span style={{ fontFamily: 'Consolas, monospace', color: '#aaa' }}>
                ({(inspectedNode.x * 1000).toFixed(1)}, {(inspectedNode.y * 1000).toFixed(1)}, {(inspectedNode.z * 1000).toFixed(1)}) mm
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>Temperature:</span>
              <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#ff6b6b' }}>
                {inspectedNode.temperature.toFixed(2)} °C
              </span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', padding: '8px 0' }}>
            Click on any temperature node in the 3D viewport to inspect its exact spatial coordinates and scalar temperature value.
          </div>
        )}
      </div>

      {/* Dataset Statistics Card */}
      {datasetData && datasetData.status === 'ok' && (
        <div style={{ backgroundColor: '#252526', padding: '16px', borderRadius: '6px', border: '1px solid #333' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#69db7c' }}>
            Dataset Statistics
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
              <span style={{ color: '#888' }}>File:</span>
              <span style={{ fontFamily: 'Consolas, monospace', color: '#fff' }}>{currentFilename || 'in-memory.csv'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
              <span style={{ color: '#888' }}>Total Nodes:</span>
              <span style={{ fontWeight: 600 }}>{datasetData.node_count?.toLocaleString()} points</span>
            </div>
            {datasetData.temperature_stats && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
                  <span style={{ color: '#888' }}>Min Temperature:</span>
                  <span style={{ color: '#4dabf7', fontWeight: 600 }}>
                    {datasetData.temperature_stats.min_temperature_C.toFixed(2)} °C
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
                  <span style={{ color: '#888' }}>Max Temperature:</span>
                  <span style={{ color: '#ff6b6b', fontWeight: 600 }}>
                    {datasetData.temperature_stats.max_temperature_C.toFixed(2)} °C
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
                  <span style={{ color: '#888' }}>Average Temperature:</span>
                  <span style={{ color: '#ffd43b', fontWeight: 600 }}>
                    {datasetData.temperature_stats.avg_temperature_C.toFixed(2)} °C
                  </span>
                </div>
              </>
            )}
            {datasetData.bbox && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Grid Dimensions:</span>
                <span style={{ fontFamily: 'Consolas, monospace', fontSize: '11px' }}>
                  {(datasetData.bbox.dimensions[0] * 1000).toFixed(0)} x {(datasetData.bbox.dimensions[1] * 1000).toFixed(0)} x {(datasetData.bbox.dimensions[2] * 1000).toFixed(0)} mm
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Point Cloud Display Controls */}
      <div style={{ backgroundColor: '#252526', padding: '16px', borderRadius: '6px', border: '1px solid #333' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#fff' }}>
          Point Cloud Display Controls
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={options.showPoints}
              onChange={(e) => onOptionsChange({ ...options, showPoints: e.target.checked })}
            />
            <span>Render Temperature Points</span>
          </label>
          {hasCadModel && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.overlayWithCad}
                onChange={(e) => onOptionsChange({ ...options, overlayWithCad: e.target.checked })}
              />
              <span>Overlay with CAD Surface Mesh</span>
            </label>
          )}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#888' }}>Node Point Size:</span>
              <span>{options.pointSize} px</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={options.pointSize}
              onChange={(e) => onOptionsChange({ ...options, pointSize: parseFloat(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
