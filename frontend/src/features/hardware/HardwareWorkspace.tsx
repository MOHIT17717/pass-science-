import React, { useState, useEffect, useCallback } from 'react';
import type { DeviceInfo, DeviceState } from '../../types/embedded';
import { SystemBlockDiagram } from './SystemBlockDiagram';
import { InterfaceTable } from './InterfaceTable';

interface TelemetryEntry {
  success: boolean;
  device_id: string;
  timestamp_ms?: number;
  numeric_metrics?: Record<string, number>;
  text_metrics?: Record<string, string>;
  error_code?: string;
  message?: string;
  recoverable?: boolean;
}

export const HardwareWorkspace: React.FC = () => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [telemetry, setTelemetry] = useState<Record<string, TelemetryEntry>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [autoPoll, setAutoPoll] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!window.workbenchAPI?.getEmbeddedDevices) return;
    try {
      const res = await window.workbenchAPI.getEmbeddedDevices();
      if (res.status === 'ok' && res.devices) {
        setDevices(res.devices);
      }
    } catch (err: any) {
      console.error('Failed to query embedded devices:', err.message);
    }
  }, []);

  const fetchTelemetry = useCallback(async () => {
    if (!window.workbenchAPI?.getEmbeddedTelemetry) return;
    try {
      const res = await window.workbenchAPI.getEmbeddedTelemetry();
      if (res.telemetry) {
        const map: Record<string, TelemetryEntry> = {};
        for (const t of res.telemetry) {
          map[t.device_id] = t;
        }
        setTelemetry(map);
      }
    } catch (err: any) {
      console.error('Failed to query embedded telemetry:', err.message);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await fetchDevices();
    await fetchTelemetry();
    setLoading(false);
  }, [fetchDevices, fetchTelemetry]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 2000);
    return () => clearInterval(interval);
  }, [autoPoll, fetchTelemetry]);

  const handleConnect = async (deviceId: string) => {
    if (!window.workbenchAPI?.connectEmbeddedDevice) return;
    setStatusMessage(`Connecting to ${deviceId}...`);
    try {
      const res = await window.workbenchAPI.connectEmbeddedDevice(deviceId);
      if (res.status === 'ok') {
        setStatusMessage(`Connected to ${deviceId}.`);
      } else {
        setStatusMessage(`Error connecting to ${deviceId}: ${res.error || res.message}`);
      }
      await refreshAll();
    } catch (err: any) {
      setStatusMessage(`Connection exception: ${err.message}`);
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    if (!window.workbenchAPI?.disconnectEmbeddedDevice) return;
    setStatusMessage(`Disconnecting from ${deviceId}...`);
    try {
      const res = await window.workbenchAPI.disconnectEmbeddedDevice(deviceId);
      if (res.status === 'ok') {
        setStatusMessage(`Disconnected from ${deviceId}.`);
      } else {
        setStatusMessage(`Error disconnecting from ${deviceId}: ${res.error || res.message}`);
      }
      await refreshAll();
    } catch (err: any) {
      setStatusMessage(`Disconnect exception: ${err.message}`);
    }
  };

  const handleConnectAll = async () => {
    if (!window.workbenchAPI?.connectEmbeddedDevice) return;
    setStatusMessage('Connecting all simulated devices...');
    for (const d of devices) {
      await window.workbenchAPI.connectEmbeddedDevice(d.id);
    }
    await refreshAll();
    setStatusMessage('All devices connected.');
  };

  const handleDisconnectAll = async () => {
    if (!window.workbenchAPI?.disconnectEmbeddedDevice) return;
    setStatusMessage('Disconnecting all devices...');
    for (const d of devices) {
      await window.workbenchAPI.disconnectEmbeddedDevice(d.id);
    }
    await refreshAll();
    setStatusMessage('All devices disconnected.');
  };

  const handleToggleFault = async (deviceId: string, isFaulted: boolean) => {
    if (!window.workbenchAPI?.injectEmbeddedFault) return;
    const action = isFaulted ? 'clear_fault' : 'inject_timeout';
    setStatusMessage(`${isFaulted ? 'Clearing fault on' : 'Injecting timeout fault into'} ${deviceId}...`);
    try {
      const res = await window.workbenchAPI.injectEmbeddedFault(deviceId, action);
      if (res.status === 'ok') {
        setStatusMessage(`${deviceId} fault state updated to: ${res.state}`);
      } else {
        setStatusMessage(`Fault action failed: ${res.error || res.details}`);
      }
      await refreshAll();
    } catch (err: any) {
      setStatusMessage(`Fault injection exception: ${err.message}`);
    }
  };

  const getStateColor = (state: DeviceState) => {
    switch (state) {
      case 'connected': return { bg: '#1a3320', text: '#69db7c', border: '#2b8a3e', label: 'CONNECTED' };
      case 'faulted': return { bg: '#3b1616', text: '#ff6b6b', border: '#c92a2a', label: 'FAULT ACTIVE' };
      case 'disconnected':
      default: return { bg: '#2b2b2b', text: '#adb5bd', border: '#495057', label: 'DISCONNECTED' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', color: '#e0e0e0' }}>
      {/* Top Banner: Prominent Simulation Disclaimer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        backgroundColor: '#2b2310',
        border: '1px solid #e67700',
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <div style={{ color: '#ffd43b', fontWeight: 600, fontSize: '13px', letterSpacing: '0.5px' }}>
              SIMULATED HOST-SIDE HARDWARE — NO PHYSICAL CONNECTION REQUIRED
            </div>
            <div style={{ color: '#ccc', fontSize: '11px', marginTop: '2px' }}>
              This environment executes pure host-side deterministic simulation adapters for the NUCLEO-F401RE MCU, Digilent Basys 3 FPGA, and SEGGER J-Link probe. No external cables, boards, or target hardware are needed.
            </div>
          </div>
        </div>
        <div style={{
          backgroundColor: '#1b1b1b',
          border: '1px solid #555',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '11px',
          color: '#aaa',
          whiteSpace: 'nowrap'
        }}>
          Simulated: <strong>Active</strong>
        </div>
      </div>

      {/* Title & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 600 }}>
            4. Embedded System Hardware Integration
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
            Multi-device bus architecture, deterministic telemetry readouts, non-blocking fault injection, and isolated recovery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleConnectAll}
            style={{
              padding: '7px 14px',
              backgroundColor: '#2b8a3e',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            Connect All
          </button>
          <button
            onClick={handleDisconnectAll}
            style={{
              padding: '7px 14px',
              backgroundColor: '#495057',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            Disconnect All
          </button>
          <button
            onClick={refreshAll}
            disabled={loading}
            style={{
              padding: '7px 14px',
              backgroundColor: '#0e639c',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh Telemetry'}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#bbb' }}>
            <input
              type="checkbox"
              checked={autoPoll}
              onChange={(e) => setAutoPoll(e.target.checked)}
            />
            Auto-Poll (2s)
          </label>
        </div>
      </div>

      {statusMessage && (
        <div style={{ padding: '8px 12px', backgroundColor: '#1e2d3d', border: '1px solid #1971c2', borderRadius: '4px', fontSize: '11px', color: '#a5d8ff', marginBottom: '16px' }}>
          ℹ️ {statusMessage}
        </div>
      )}

      {/* 3 Device Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {devices.map((device) => {
          const stateStyle = getStateColor(device.state);
          const t = telemetry[device.id];
          const isConnected = device.state === 'connected';
          const isFaulted = device.state === 'faulted';

          return (
            <div
              key={device.id}
              style={{
                backgroundColor: '#252526',
                borderRadius: '8px',
                border: `1px solid ${stateStyle.border}`,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Card Header */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#1e1e1e',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 600 }}>
                    {device.name}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#888' }}>
                    {device.category.toUpperCase()} • ID: <code style={{ color: '#4dabf7' }}>{device.id}</code>
                  </span>
                </div>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  backgroundColor: stateStyle.bg,
                  color: stateStyle.text,
                  border: `1px solid ${stateStyle.border}`
                }}>
                  {stateStyle.label}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Specifications */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#777' }}>Target Silicon:</span>
                    <div style={{ color: '#fff', fontWeight: 500 }}>{device.target_silicon}</div>
                  </div>
                  <div>
                    <span style={{ color: '#777' }}>Host Interface:</span>
                    <div style={{ color: '#fff', fontWeight: 500 }}>{device.host_interface}</div>
                  </div>
                  <div>
                    <span style={{ color: '#777' }}>Power Domains:</span>
                    <div style={{ color: '#ffd43b', fontWeight: 500 }}>{device.power_domains}</div>
                  </div>
                  <div>
                    <span style={{ color: '#777' }}>Physical Connectors:</span>
                    <div style={{ color: '#ccc', fontWeight: 500 }}>{device.physical_connectors}</div>
                  </div>
                </div>

                {/* Telemetry Section */}
                <div style={{
                  backgroundColor: '#181818',
                  borderRadius: '6px',
                  border: '1px solid #282828',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>DETERMINISTIC TELEMETRY</span>
                    {t?.timestamp_ms && (
                      <span style={{ fontSize: '10px', color: '#666' }}>
                        T+{t.timestamp_ms}ms
                      </span>
                    )}
                  </div>

                  {isConnected && t?.success && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {t.numeric_metrics && Object.entries(t.numeric_metrics).map(([key, val]) => (
                        <div key={key} style={{ backgroundColor: '#202020', padding: '6px 8px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#888' }}>
                            {key.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#69db7c' }}>
                            {typeof val === 'number' ? (key.includes('C') || key.includes('v') || key.includes('mhz') || key.includes('percent') ? val.toFixed(2) : val) : val}
                            <span style={{ fontSize: '10px', color: '#aaa', marginLeft: '3px' }}>
                              {key.includes('temperature') ? '°C' : key.includes('v') ? 'V' : key.includes('mhz') ? 'MHz' : key.includes('percent') ? '%' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                      {t.text_metrics && Object.entries(t.text_metrics).map(([key, val]) => (
                        <div key={key} style={{ backgroundColor: '#202020', padding: '6px 8px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#888' }}>
                            {key.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: val === 'PASS' || val === 'OK' ? '#69db7c' : '#4dabf7' }}>
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isFaulted && (
                    <div style={{
                      backgroundColor: '#3b1616',
                      border: '1px solid #c92a2a',
                      borderRadius: '4px',
                      padding: '8px 10px',
                      color: '#ff8787',
                      fontSize: '11px',
                      lineHeight: 1.4
                    }}>
                      <strong>FAULT ACTIVE (HTTP 504):</strong>
                      <div style={{ marginTop: '2px' }}>
                        Simulated non-blocking timeout on bus response. Isolated device failure. Click "Clear Fault" to recover normal telemetry.
                      </div>
                    </div>
                  )}

                  {device.state === 'disconnected' && (
                    <div style={{ textAlign: 'center', padding: '12px', color: '#666', fontSize: '11px' }}>
                      Device link is disconnected. Click "Connect" to query telemetry.
                    </div>
                  )}
                </div>

                {/* Control Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                  {device.state === 'disconnected' ? (
                    <button
                      onClick={() => handleConnect(device.id)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        backgroundColor: '#0e639c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      Connect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDisconnect(device.id)}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        backgroundColor: '#333333',
                        color: '#ddd',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 500
                      }}
                    >
                      Disconnect
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleFault(device.id, isFaulted)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      backgroundColor: isFaulted ? '#2b8a3e' : '#c92a2a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    {isFaulted ? 'Clear Fault (Recover)' : 'Simulate Timeout (504)'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Architecture Block Diagram */}
      <SystemBlockDiagram />

      {/* Interface & Pin Mapping Reference Table */}
      <InterfaceTable />
    </div>
  );
};
