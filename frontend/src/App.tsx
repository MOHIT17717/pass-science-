import React, { useState, useEffect } from 'react';
import { ThreeViewport } from './components/ThreeViewport';
import { TemperatureLegend } from './components/TemperatureLegend';
import { ViewportControls } from './components/ViewportControls';
import { GeometryWorkspace } from './features/geometry/GeometryWorkspace';
import { TemperatureWorkspace } from './features/temperature/TemperatureWorkspace';
import type { BackendStatus } from '../../electron/preload/api';
import type { StlModelData, GeometryViewOptions } from './types/geometry';
import type { TemperatureDatasetData, TemperatureViewOptions, InspectedNode } from './types/temperature';

type TabId = '3d-workbench' | 'thermal' | 'performance' | 'hardware' | 'backprop';
type SidebarTab = 'geometry' | 'temperature' | 'layers';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('3d-workbench');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('geometry');

  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    online: false,
    port: null,
    pid: null
  });

  // CAD STL State
  const [stlData, setStlData] = useState<StlModelData | null>(null);
  const [stlFilename, setStlFilename] = useState<string | null>(null);
  const [geometryOptions, setGeometryOptions] = useState<GeometryViewOptions>({
    showSurface: true,
    wireframe: false,
    opacity: 0.85
  });

  // Temperature CSV State
  const [csvData, setCsvData] = useState<TemperatureDatasetData | null>(null);
  const [csvFilename, setCsvFilename] = useState<string | null>(null);
  const [temperatureOptions, setTemperatureOptions] = useState<TemperatureViewOptions>({
    showPoints: true,
    pointSize: 4.5,
    overlayWithCad: true
  });

  // Node Inspection State
  const [inspectedNode, setInspectedNode] = useState<InspectedNode | null>(null);

  // Camera Signal
  const [cameraTrigger, setCameraTrigger] = useState<{ type: 'fit' | 'top' | 'front' | 'side' | 'iso'; timestamp: number } | null>(null);

  useEffect(() => {
    console.log('[App] React shell mounted. Preload API present:', !!window.workbenchAPI);
    if (!window.workbenchAPI) return;

    window.workbenchAPI.getBackendStatus()
      .then(setBackendStatus)
      .catch((err) => console.error('Failed to get backend status:', err));

    const unsubscribe = window.workbenchAPI.onBackendStatusChange((status) => {
      setBackendStatus(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const triggerCamera = (type: 'fit' | 'top' | 'front' | 'side' | 'iso') => {
    setCameraTrigger({ type, timestamp: Date.now() });
  };

  const handleQuickLoadSampleStl = async () => {
    if (!window.workbenchAPI) return;
    try {
      const sample = await window.workbenchAPI.loadSample('stl');
      const res = await window.workbenchAPI.parseStl(sample.content);
      if (res.status === 'ok') {
        setStlData(res);
        setStlFilename(sample.filename);
        triggerCamera('fit');
      }
    } catch (e: any) {
      console.error('Failed to load sample STL:', e.message);
    }
  };

  const handleQuickLoadSampleCsv = async () => {
    if (!window.workbenchAPI) return;
    try {
      const sample = await window.workbenchAPI.loadSample('csv');
      const res = await window.workbenchAPI.parseCsv(sample.content);
      if (res.status === 'ok') {
        setCsvData(res);
        setCsvFilename(sample.filename);
        triggerCamera('fit');
      }
    } catch (e: any) {
      console.error('Failed to load sample CSV:', e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#181818', color: '#e0e0e0', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Top Header & Navigation */}
      <header style={{ padding: '8px 16px', backgroundColor: '#252526', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: backendStatus.online ? '#40c057' : '#fa5252' }} />
          <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>Unified Engineering Workbench</h1>
        </div>
        <nav style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: '3d-workbench', label: '1. 3D Workbench (CAD & Temp)' },
            { id: 'thermal', label: '2. Thermal FEM' },
            { id: 'performance', label: '3. Performance' },
            { id: 'hardware', label: '4. Hardware' },
            { id: 'backprop', label: '5. Backpropagation' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              style={{
                padding: '6px 12px',
                backgroundColor: activeTab === tab.id ? '#0e639c' : '#333333',
                color: activeTab === tab.id ? '#fff' : '#bbb',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'background-color 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Workspace Area */}
      <main style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {activeTab === '3d-workbench' ? (
          <>
            {/* Left Control Sidebar */}
            <aside style={{ width: '380px', backgroundColor: '#1e1e1e', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
              {/* Sidebar Navigation Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #333', backgroundColor: '#252526' }}>
                <button
                  onClick={() => setSidebarTab('geometry')}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    backgroundColor: sidebarTab === 'geometry' ? '#1e1e1e' : 'transparent',
                    color: sidebarTab === 'geometry' ? '#4dabf7' : '#888',
                    border: 'none',
                    borderBottom: sidebarTab === 'geometry' ? '2px solid #4dabf7' : 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  CAD Geometry {stlData ? '●' : ''}
                </button>
                <button
                  onClick={() => setSidebarTab('temperature')}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    backgroundColor: sidebarTab === 'temperature' ? '#1e1e1e' : 'transparent',
                    color: sidebarTab === 'temperature' ? '#69db7c' : '#888',
                    border: 'none',
                    borderBottom: sidebarTab === 'temperature' ? '2px solid #69db7c' : 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  Temperature CSV {csvData ? '●' : ''}
                </button>
                <button
                  onClick={() => setSidebarTab('layers')}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    backgroundColor: sidebarTab === 'layers' ? '#1e1e1e' : 'transparent',
                    color: sidebarTab === 'layers' ? '#ffd43b' : '#888',
                    border: 'none',
                    borderBottom: sidebarTab === 'layers' ? '2px solid #ffd43b' : 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  Layer Overlay
                </button>
              </div>

              {/* Sidebar Content Panel */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {sidebarTab === 'geometry' && (
                  <GeometryWorkspace
                    modelData={stlData}
                    options={geometryOptions}
                    onOptionsChange={setGeometryOptions}
                    onModelLoaded={(data, filename) => {
                      setStlData(data);
                      setStlFilename(filename);
                      triggerCamera('fit');
                    }}
                    onClear={() => {
                      setStlData(null);
                      setStlFilename(null);
                    }}
                  />
                )}
                {sidebarTab === 'temperature' && (
                  <TemperatureWorkspace
                    datasetData={csvData}
                    options={temperatureOptions}
                    onOptionsChange={setTemperatureOptions}
                    onDatasetLoaded={(data, filename) => {
                      setCsvData(data);
                      setCsvFilename(filename);
                      triggerCamera('fit');
                    }}
                    inspectedNode={inspectedNode}
                    hasCadModel={!!stlData}
                    onClear={() => {
                      setCsvData(null);
                      setCsvFilename(null);
                      setInspectedNode(null);
                    }}
                  />
                )}
                {sidebarTab === 'layers' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ backgroundColor: '#252526', padding: '16px', borderRadius: '6px', border: '1px solid #333' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#fff' }}>
                        Multi-Layer Overlay Configuration
                      </h4>
                      <p style={{ fontSize: '11px', color: '#888', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                        Overlay the 3D thermal point cloud with the CAD bracket mesh to evaluate temperature distribution across the physical geometric boundaries.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={geometryOptions.showSurface}
                            onChange={(e) => setGeometryOptions({ ...geometryOptions, showSurface: e.target.checked })}
                          />
                          <span>Show CAD Surface ({stlFilename || 'No model loaded'})</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={temperatureOptions.showPoints}
                            onChange={(e) => setTemperatureOptions({ ...temperatureOptions, showPoints: e.target.checked })}
                          />
                          <span>Show Temperature Points ({csvFilename || 'No dataset loaded'})</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={geometryOptions.wireframe}
                            onChange={(e) => setGeometryOptions({ ...geometryOptions, wireframe: e.target.checked })}
                          />
                          <span>Show CAD Wireframe Edges</span>
                        </label>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#888' }}>CAD Transparency:</span>
                            <span>{Math.round(geometryOptions.opacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={geometryOptions.opacity}
                            onChange={(e) => setGeometryOptions({ ...geometryOptions, opacity: parseFloat(e.target.value) })}
                            style={{ width: '100%', cursor: 'pointer' }}
                          />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#888' }}>Point Cloud Size:</span>
                            <span>{temperatureOptions.pointSize} px</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="0.5"
                            value={temperatureOptions.pointSize}
                            onChange={(e) => setTemperatureOptions({ ...temperatureOptions, pointSize: parseFloat(e.target.value) })}
                            style={{ width: '100%', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Right 3D Viewport */}
            <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
              <ThreeViewport
                stlData={stlData}
                csvData={csvData}
                geometryOptions={geometryOptions}
                temperatureOptions={temperatureOptions}
                inspectedNode={inspectedNode}
                onInspectNode={setInspectedNode}
                cameraTrigger={cameraTrigger}
              />

              {/* Viewport Floating Controls */}
              <ViewportControls
                onCameraPreset={triggerCamera}
                hasGeometry={!!stlData}
                hasTemperature={!!csvData}
              />

              {/* Temperature Colormap Legend */}
              {csvData && csvData.status === 'ok' && temperatureOptions.showPoints && csvData.temperature_stats && (
                <TemperatureLegend
                  minTemp={csvData.temperature_stats.min_temperature_C}
                  maxTemp={csvData.temperature_stats.max_temperature_C}
                  avgTemp={csvData.temperature_stats.avg_temperature_C}
                />
              )}

              {/* Empty State Overlay */}
              {!stlData && !csvData && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(26, 26, 26, 0.92)',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    padding: '24px 32px',
                    textAlign: 'center',
                    maxWidth: '480px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    pointerEvents: 'auto'
                  }}
                >
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff' }}>
                    3D Engineering Workbench Visualizer
                  </h3>
                  <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                    Import an ASCII STL CAD file or 3D Temperature CSV dataset from the left panel to begin 3D visualization.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      onClick={handleQuickLoadSampleStl}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#0e639c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      Load Sample CAD Bracket
                    </button>
                    <button
                      onClick={handleQuickLoadSampleCsv}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#333333',
                        color: '#69db7c',
                        border: '1px solid #69db7c',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      Load Synthetic Point Cloud
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            {activeTab === 'thermal' && (
              <div>
                <h2>2. Thermal FEA Analysis</h2>
                <p style={{ color: '#aaa' }}>1D Steady-State Thermal Finite Element Solver baseline verified in C++ core.</p>
              </div>
            )}
            {activeTab === 'performance' && (
              <div>
                <h2>3. Multicore Performance Benchmarking</h2>
                <p style={{ color: '#aaa' }}>Parallel batch worker pool foundation.</p>
              </div>
            )}
            {activeTab === 'hardware' && (
              <div>
                <h2>4. Embedded System Hardware Integration</h2>
                <p style={{ color: '#aaa' }}>Microcontroller, FPGA, and JTAG simulation adapters.</p>
              </div>
            )}
            {activeTab === 'backprop' && (
              <div>
                <h2>5. Manual Backpropagation Neural Network</h2>
                <p style={{ color: '#aaa' }}>Analytical gradient calculation and 100-step training history.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Status Bar */}
      <footer style={{ padding: '6px 16px', backgroundColor: '#007acc', color: '#fff', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>
            C++ Backend: <strong>{backendStatus.online ? `Online (Port: ${backendStatus.port ?? 'N/A'}, PID: ${backendStatus.pid ?? 'N/A'})` : 'Standby'}</strong>
          </span>
          {stlFilename && <span>CAD: <strong>{stlFilename}</strong> ({stlData?.triangle_count} facets)</span>}
          {csvFilename && <span>Point Cloud: <strong>{csvFilename}</strong> ({csvData?.node_count} nodes)</span>}
        </div>
        <div>
          Windows 11 x64 | C++17 Authoritative Core | Three.js WebGL 2.0
        </div>
      </footer>
    </div>
  );
};

export default App;
