import React from 'react';

export const SystemBlockDiagram: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333', padding: '20px', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
            System Architecture & Interconnect Block Diagram
          </h4>
          <span style={{ fontSize: '11px', color: '#888' }}>
            Logical topology of host-side simulation adapters and inter-module signal routing
          </span>
        </div>
        <div style={{
          backgroundColor: '#2b2310',
          border: '1px solid #e67700',
          borderRadius: '4px',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#ffd43b'
        }}>
          SIMULATED HOST-SIDE HARDWARE — NO PHYSICAL CONNECTION REQUIRED
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', backgroundColor: '#181818', borderRadius: '6px', border: '1px solid #282828', padding: '10px' }}>
        <svg
          viewBox="0 0 920 480"
          style={{ width: '100%', minWidth: '800px', height: 'auto', display: 'block' }}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#4dabf7" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#69db7c" />
            </marker>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#da77f2" />
            </marker>
            <marker id="arrow-yellow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ffd43b" />
            </marker>
          </defs>

          {/* Background grid */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#222" strokeWidth="0.5" />
          </pattern>
          <rect width="920" height="480" fill="url(#grid)" />

          {/* 1. Host Workbench Box */}
          <g transform="translate(40, 40)">
            <rect width="220" height="110" rx="6" fill="#252526" stroke="#0e639c" strokeWidth="2" />
            <rect width="220" height="26" rx="6" fill="#0e639c" />
            <text x="110" y="17" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">
              HOST PC WORKBENCH
            </text>
            <text x="12" y="48" fill="#e0e0e0" fontSize="11" fontWeight="600">Electron GUI + C++17 Core</text>
            <text x="12" y="66" fill="#aaa" fontSize="10">Loopback API: 127.0.0.1:port</text>
            <text x="12" y="84" fill="#aaa" fontSize="10">Supervised Process Lifecycle</text>
            <text x="12" y="100" fill="#ffd43b" fontSize="9" fontWeight="bold">[Host Simulated Environment]</text>
          </g>

          {/* 2. SEGGER J-Link Adapter Box */}
          <g transform="translate(40, 260)">
            <rect width="220" height="150" rx="6" fill="#252526" stroke="#da77f2" strokeWidth="2" />
            <rect width="220" height="26" rx="6" fill="#845ef7" />
            <text x="110" y="17" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">
              SEGGER J-LINK ADAPTER
            </text>
            <text x="12" y="48" fill="#e0e0e0" fontSize="11" fontWeight="600">Model: J-Link Base (Simulated)</text>
            <text x="12" y="66" fill="#aaa" fontSize="10">TCK Frequency: 4.0 MHz (Fixed)</text>
            <text x="12" y="84" fill="#aaa" fontSize="10">V_Tref Sensing: 3.30 V</text>
            <text x="12" y="102" fill="#aaa" fontSize="10">Standard 20-Pin 0.1" Ribbon</text>
            <rect x="10" y="112" width="200" height="28" rx="4" fill="#3b2b54" />
            <text x="110" y="124" fill="#da77f2" fontSize="9" textAnchor="middle">Illustrative Custom Topology</text>
            <text x="110" y="136" fill="#da77f2" fontSize="9" textAnchor="middle">Not a verified physical chain</text>
          </g>

          {/* 3. STM32 NUCLEO-F401RE Box */}
          <g transform="translate(370, 40)">
            <rect width="240" height="210" rx="6" fill="#252526" stroke="#4dabf7" strokeWidth="2" />
            <rect width="240" height="26" rx="6" fill="#1971c2" />
            <text x="120" y="17" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">
              STM32 NUCLEO-F401RE
            </text>
            <text x="12" y="48" fill="#e0e0e0" fontSize="11" fontWeight="600">Silicon: STM32F401RE (ARM M4)</text>
            <text x="12" y="66" fill="#aaa" fontSize="10">Host I/F: ST-LINK/V2-1 USB Bridge</text>
            <text x="12" y="84" fill="#aaa" fontSize="10">Power Rails: VDD = 3.3V, 5.0V USB</text>
            <text x="12" y="102" fill="#aaa" fontSize="10">Connectors: ST Morpho (CN7, CN10)</text>
            <text x="12" y="118" fill="#888" fontSize="9">※ Note: No native Pmod headers</text>

            <rect x="10" y="130" width="220" height="70" rx="4" fill="#1a2530" stroke="#339af0" strokeWidth="1" strokeDasharray="3 3" />
            <text x="18" y="146" fill="#4dabf7" fontSize="10" fontWeight="bold">Proposed Interconnect Pinout:</text>
            <text x="18" y="162" fill="#ccc" fontSize="10">CN7 Pin 1  (PA9 / USART1_TX)</text>
            <text x="18" y="178" fill="#ccc" fontSize="10">CN7 Pin 21 (PA10 / USART1_RX)</text>
            <text x="18" y="194" fill="#ccc" fontSize="10">CN7 Pin 20 (GND Reference)</text>
          </g>

          {/* 4. Digilent Basys 3 FPGA Box */}
          <g transform="translate(670, 40)">
            <rect width="220" height="240" rx="6" fill="#252526" stroke="#69db7c" strokeWidth="2" />
            <rect width="220" height="26" rx="6" fill="#2b8a3e" />
            <text x="110" y="17" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">
              DIGILENT BASYS 3 FPGA
            </text>
            <text x="12" y="48" fill="#e0e0e0" fontSize="11" fontWeight="600">Silicon: Artix-7 XC7A35T</text>
            <text x="12" y="66" fill="#aaa" fontSize="10">Host I/F: FTDI FT2232HQ USB-JTAG</text>
            <text x="12" y="84" fill="#aaa" fontSize="10">Core Rail: VCCINT = 1.00 V</text>
            <text x="12" y="102" fill="#aaa" fontSize="10">Aux Rail: VCCAUX = 1.80 V</text>
            <text x="12" y="120" fill="#aaa" fontSize="10">I/O Rail: VCCO = 3.30 V</text>
            <text x="12" y="138" fill="#aaa" fontSize="10">Connectors: 4x 12-pin Pmod (JA..)</text>

            <rect x="10" y="152" width="200" height="78" rx="4" fill="#192a1d" stroke="#51cf66" strokeWidth="1" strokeDasharray="3 3" />
            <text x="18" y="168" fill="#69db7c" fontSize="10" fontWeight="bold">Proposed Interconnect Pinout:</text>
            <text x="18" y="184" fill="#ccc" fontSize="10">Pmod JA Pin 2 (JA2 / UART_RX)</text>
            <text x="18" y="200" fill="#ccc" fontSize="10">Pmod JA Pin 3 (JA3 / UART_TX)</text>
            <text x="18" y="216" fill="#ccc" fontSize="10">Pmod JA Pin 5 (GND Reference)</text>
          </g>

          {/* Connections: USB Host to Devices */}
          {/* Host -> MCU USB */}
          <path d="M 260 85 L 370 85" fill="none" stroke="#4dabf7" strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="315" y="78" fill="#4dabf7" fontSize="9" textAnchor="middle">USB Host</text>

          {/* Host -> FPGA USB */}
          <path d="M 150 40 L 150 20 L 780 20 L 780 40" fill="none" stroke="#69db7c" strokeWidth="2" markerEnd="url(#arrow-green)" />
          <text x="465" y="15" fill="#69db7c" fontSize="9" textAnchor="middle">USB-JTAG/UART (FTDI)</text>

          {/* Host -> J-Link USB */}
          <path d="M 150 150 L 150 260" fill="none" stroke="#da77f2" strokeWidth="2" markerEnd="url(#arrow-purple)" />
          <text x="156" y="210" fill="#da77f2" fontSize="9">USB 2.0</text>

          {/* Interconnect: MCU to FPGA (Proposed UART link) */}
          <path d="M 610 160 L 670 160" fill="none" stroke="#ffd43b" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow-yellow)" />
          <path d="M 670 190 L 610 190" fill="none" stroke="#ffd43b" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow-yellow)" />
          <text x="640" y="150" fill="#ffd43b" fontSize="9" fontWeight="bold" textAnchor="middle">TX → RX</text>
          <text x="640" y="206" fill="#ffd43b" fontSize="9" fontWeight="bold" textAnchor="middle">RX ← TX</text>

          {/* JTAG Daisy Chain (Illustrative Custom Test Topology) */}
          <path d="M 260 330 L 490 330 L 490 250" fill="none" stroke="#da77f2" strokeWidth="1.5" strokeDasharray="5 3" />
          <path d="M 490 330 L 780 330 L 780 280" fill="none" stroke="#da77f2" strokeWidth="1.5" strokeDasharray="5 3" />
          <circle cx="260" cy="330" r="3" fill="#da77f2" />
          <circle cx="490" cy="330" r="3" fill="#da77f2" />
          <circle cx="780" cy="330" r="3" fill="#da77f2" />

          {/* Bottom Interconnect Callout Box */}
          <g transform="translate(370, 360)">
            <rect width="520" height="96" rx="6" fill="#252526" stroke="#444" strokeWidth="1" />
            <text x="16" y="22" fill="#ffd43b" fontSize="11" fontWeight="bold">
              Interconnect & Voltage Domain Compatibility Analysis:
            </text>
            <text x="16" y="42" fill="#bbb" fontSize="10">
              • Direct 3.3V CMOS compatibility: MCU PA9/PA10 and FPGA Pmod JA (Bank 14/VCCO=3.3V) share a 3.3V logic level.
            </text>
            <text x="16" y="58" fill="#bbb" fontSize="10">
              • Level shifter not required for direct 3.3V-to-3.3V UART routing (common GND reference established).
            </text>
            <text x="16" y="74" fill="#ff8787" fontSize="10" fontWeight="600">
              • Interconnect Status: Proposed custom interconnect — conceptual mapping, unverified physical routing.
            </text>
            <text x="16" y="88" fill="#da77f2" fontSize="9">
              • JTAG Chain Status: Illustrative custom test topology only — Basys 3 uses onboard FTDI; Nucleo uses ST-LINK/SWD.
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
