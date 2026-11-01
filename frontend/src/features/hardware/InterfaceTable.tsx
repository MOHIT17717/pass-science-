import React from 'react';

interface InterfaceRow {
  signal: string;
  sourcePin: string;
  destPin: string;
  powerDomain: string;
  levelShifting: string;
  protocol: string;
  status: string;
}

const INTERFACE_MAPPINGS: InterfaceRow[] = [
  {
    signal: 'UART_TX (MCU → FPGA)',
    sourcePin: 'STM32 Nucleo CN7 Pin 1 (PA9 / USART1_TX)',
    destPin: 'Basys 3 Pmod JA Pin 2 (JA2 / RX)',
    powerDomain: '3.3V LVCMOS (VDD = 3.3V, VCCO = 3.3V)',
    levelShifting: 'Direct connection; voltage matched (3.3V logic)',
    protocol: 'UART 115200 baud, 8 data bits, no parity, 1 stop bit',
    status: 'Proposed custom interconnect — conceptual mapping'
  },
  {
    signal: 'UART_RX (FPGA → MCU)',
    sourcePin: 'Basys 3 Pmod JA Pin 3 (JA3 / TX)',
    destPin: 'STM32 Nucleo CN7 Pin 21 (PA10 / USART1_RX)',
    powerDomain: '3.3V LVCMOS (VCCO = 3.3V, VDD = 3.3V)',
    levelShifting: 'Direct connection; voltage matched (3.3V logic)',
    protocol: 'UART 115200 baud, 8 data bits, no parity, 1 stop bit',
    status: 'Proposed custom interconnect — conceptual mapping'
  },
  {
    signal: 'GND Reference',
    sourcePin: 'STM32 Nucleo CN7 Pin 20 (GND)',
    destPin: 'Basys 3 Pmod JA Pin 5 (GND)',
    powerDomain: '0.0V (Common Ground Return)',
    levelShifting: 'Direct bond; mandatory common reference return',
    protocol: 'Ground reference',
    status: 'Required physical reference'
  },
  {
    signal: 'JTAG Chain: TCK / TMS',
    sourcePin: 'SEGGER J-Link 20-Pin Pin 9 (TCK), Pin 7 (TMS)',
    destPin: 'Custom Header / FPGA & MCU Test Points',
    powerDomain: '3.3V Logic (V_Tref sensed at 3.30V)',
    levelShifting: 'Active buffer in J-Link probe matches target V_Tref',
    protocol: 'IEEE 1149.1 JTAG (TCK fixed at 4.0 MHz)',
    status: 'Illustrative custom topology — not a verified physical chain'
  },
  {
    signal: 'JTAG Chain: TDI / TDO',
    sourcePin: 'SEGGER J-Link Pin 5 (TDI) → FPGA TDI → MCU TDI',
    destPin: 'MCU TDO → SEGGER J-Link Pin 13 (TDO)',
    powerDomain: '3.3V Logic (V_Tref sensed at 3.30V)',
    levelShifting: 'Internal level sensing (1.2V - 5.0V dynamic support)',
    protocol: 'IEEE 1149.1 Scan Chain (2 simulated TAPs detected)',
    status: 'Illustrative custom topology — not a verified physical chain'
  }
];

export const InterfaceTable: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333', padding: '20px', marginTop: '16px' }}>
      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
          Pin & Interface Mapping Reference
        </h4>
        <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0 0' }}>
          Detailed pinout, electrical power domains, voltage level compatibility, and connection validation status.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#252526', borderBottom: '1px solid #444', color: '#aaa' }}>
              <th style={{ padding: '8px 10px' }}>Signal Function</th>
              <th style={{ padding: '8px 10px' }}>Source Pin / Header</th>
              <th style={{ padding: '8px 10px' }}>Destination Pin / Header</th>
              <th style={{ padding: '8px 10px' }}>Power Domain</th>
              <th style={{ padding: '8px 10px' }}>Level Shifter Requirement</th>
              <th style={{ padding: '8px 10px' }}>Protocol & Timing</th>
              <th style={{ padding: '8px 10px' }}>Status / Classification</th>
            </tr>
          </thead>
          <tbody>
            {INTERFACE_MAPPINGS.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid #282828',
                  backgroundColor: idx % 2 === 0 ? '#1b1b1b' : '#1e1e1e'
                }}
              >
                <td style={{ padding: '8px 10px', color: '#fff', fontWeight: 600 }}>{row.signal}</td>
                <td style={{ padding: '8px 10px', color: '#4dabf7', fontFamily: 'monospace' }}>{row.sourcePin}</td>
                <td style={{ padding: '8px 10px', color: '#69db7c', fontFamily: 'monospace' }}>{row.destPin}</td>
                <td style={{ padding: '8px 10px', color: '#ffd43b' }}>{row.powerDomain}</td>
                <td style={{ padding: '8px 10px', color: '#ccc' }}>{row.levelShifting}</td>
                <td style={{ padding: '8px 10px', color: '#aaa' }}>{row.protocol}</td>
                <td style={{ padding: '8px 10px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      backgroundColor: row.status.includes('Proposed')
                        ? '#3b2b10'
                        : row.status.includes('Illustrative')
                        ? '#3b2042'
                        : '#1a3320',
                      color: row.status.includes('Proposed')
                        ? '#ffd43b'
                        : row.status.includes('Illustrative')
                        ? '#da77f2'
                        : '#69db7c',
                      border: `1px solid ${
                        row.status.includes('Proposed')
                          ? '#805d00'
                          : row.status.includes('Illustrative')
                          ? '#703884'
                          : '#2b8a3e'
                      }`
                    }}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#252526', borderRadius: '4px', borderLeft: '3px solid #ffd43b', fontSize: '11px', color: '#bbb' }}>
        <strong>Hardware Disclosures & Design Boundaries:</strong>
        <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', lineHeight: 1.4 }}>
          <li>
            <strong>Connector Clarification:</strong> STM32 NUCLEO-F401RE provides ST Morpho headers (CN7, CN10) and Arduino Uno R3 headers; it does not feature native Digilent Pmod headers. Interconnection to Basys 3 Pmod JA requires a jumper harness.
          </li>
          <li>
            <strong>UART Interconnection:</strong> Marked as <em>proposed custom interconnect</em>. Direct 3.3V CMOS signals are electrically compatible between STM32 PA9/PA10 and Artix-7 Bank 14 (VCCO = 3.3V), but physical routing has not been physically fabricated.
          </li>
          <li>
            <strong>JTAG Daisy Chain:</strong> Marked as an <em>illustrative custom test topology</em>. The Digilent Basys 3 incorporates an onboard FT2232HQ USB-JTAG bridge and the NUCLEO board provides an onboard ST-LINK/SWD bridge. A unified external SEGGER J-Link chain is a conceptual validation configuration.
          </li>
        </ul>
      </div>
    </div>
  );
};
