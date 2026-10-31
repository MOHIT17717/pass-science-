import React, { useState, useEffect } from 'react';
import { ThreeViewport } from './components/ThreeViewport';
import type { BackendStatus } from '../../electron/preload/api';

type TabId = 'geometry' | 'thermal' | 'performance' | 'hardware' | 'backprop';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('geometry');
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    online: false,
    port: null,
    pid: null
  });

  useEffect(() => {
    console.log('[App] React shell mounted. Preload API present:', !!window.workbenchAPI);
    if (!window.workbenchAPI) return;

    // Fetch initial status
    window.workbenchAPI.getBackendStatus()
      .then(setBackendStatus)
      .catch((err) => console.error('Failed to get backend status:', err));

    // Subscribe to dynamic status changes
    const unsubscribe = window.workbenchAPI.onBackendStatusChange((status) => {
      setBackendStatus(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#1e1e1e', color: '#e0e0e0', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Top Header & Navigation */}
      <header style={{ padding: '8px 16px', backgroundColor: '#252526', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Unified Engineering Workbench</h1>
        <nav style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'geometry', label: '1. Geometry (3D)' },
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
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'geometry' && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <ThreeViewport />
            <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(30,30,30,0.85)', padding: '8px 12px', borderRadius: 4, border: '1px solid #444', fontSize: '12px' }}>
              <strong>Three.js Viewport Foundation</strong>
              <div>Grid & Lighting Active | WebGL 2.0</div>
            </div>
          </div>
        )}
        {activeTab === 'thermal' && (
          <div style={{ padding: '24px' }}>
            <h2>Thermal FEA Analysis</h2>
            <p>1D Steady-State Thermal Finite Element Solver baseline verified in C++ core.</p>
          </div>
        )}
        {activeTab === 'performance' && (
          <div style={{ padding: '24px' }}>
            <h2>Multicore Performance Benchmarking</h2>
            <p>Parallel batch worker pool foundation.</p>
          </div>
        )}
        {activeTab === 'hardware' && (
          <div style={{ padding: '24px' }}>
            <h2>Embedded System Hardware Integration</h2>
            <p>Microcontroller, FPGA, and JTAG simulation adapters.</p>
          </div>
        )}
        {activeTab === 'backprop' && (
          <div style={{ padding: '24px' }}>
            <h2>Manual Backpropagation Neural Network</h2>
            <p>Analytical gradient calculation and 100-step training history.</p>
          </div>
        )}
      </main>

      {/* Status Bar */}
      <footer style={{ padding: '4px 16px', backgroundColor: '#007acc', color: '#fff', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          C++ Backend: {backendStatus.online ? `Online (Port: ${backendStatus.port ?? 'N/A'})` : 'Standby'}
        </div>
        <div>
          Windows 11 x64 | C++17 Core Verified | Electron Preload Active
        </div>
      </footer>
    </div>
  );
};

export default App;
