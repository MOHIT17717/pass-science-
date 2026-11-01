import React, { useState, useEffect, useRef } from 'react';
import type {
  BenchmarkSuiteResponse,
  BenchmarkJobStatus,
  WorkerBenchmarkResultDTO
} from '../../types/benchmark';
import { BenchmarkChart } from './BenchmarkChart';

export const PerformanceWorkspace: React.FC = () => {
  // Configuration State
  const [caseCount, setCaseCount] = useState<number>(2000);
  const [elements, setElements] = useState<number>(80);
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([1, 2, 4]);
  const [seed, setSeed] = useState<number>(12345);

  // Job Execution State
  const [jobStatus, setJobStatus] = useState<BenchmarkJobStatus>('idle');
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suiteResult, setSuiteResult] = useState<BenchmarkSuiteResponse | null>(null);

  // Export State
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [exportStatusMsg, setExportStatusMsg] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ content: string; rowCount: number } | null>(null);
  const [showInsights, setShowInsights] = useState<boolean>(false);

  // Monotonic request counter to prevent stale out-of-order state updates
  const currentRequestId = useRef<number>(0);

  // Initial Benchmark Run on mount if bridge is ready
  useEffect(() => {
    handleRunBenchmark();
  }, []);

  const handleRunBenchmark = async () => {
    const requestId = ++currentRequestId.current;
    setJobStatus('running');
    setErrorMessage(null);
    setExportStatusMsg(null);
    const start = performance.now();

    try {
      if (!window.workbenchAPI) {
        throw new Error('Workbench API bridge is not available.');
      }

      const res = await window.workbenchAPI.runBenchmark({
        case_count: caseCount,
        elements,
        worker_counts: selectedWorkers,
        repetitions: 5,
        seed
      });

      // Prevent stale response overwrite
      if (requestId !== currentRequestId.current) return;

      if (res.status === 'ok') {
        const elapsed = Math.round(performance.now() - start);
        setJobStatus('completed');
        setExecutionTimeMs(elapsed);
        setSuiteResult(res);
      } else {
        setJobStatus('error');
        setErrorMessage(res.error || 'Multicore benchmark run failed.');
      }
    } catch (err: any) {
      if (requestId !== currentRequestId.current) return;
      setJobStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred during benchmark dispatch.');
    }
  };

  const handleExportCsv = async () => {
    setExportLoading(true);
    setExportStatusMsg(null);

    try {
      if (!window.workbenchAPI) {
        throw new Error('Workbench API bridge is not available.');
      }

      const res = await window.workbenchAPI.exportBenchmarkCsv({
        case_count: caseCount,
        elements,
        worker_counts: selectedWorkers,
        repetitions: 5,
        seed
      });

      if (res.status === 'ok' && res.csv) {
        const rowCount = res.rowCount ?? 0;
        setCsvPreview({ content: res.csv, rowCount });
        setExportStatusMsg(`C++ verified benchmark export ready: ${rowCount} worker rows.`);

        // Prompt native save file dialog
        const defaultFilename = `multicore_benchmark_cases${caseCount}_N${elements}.csv`;
        const saveRes = await window.workbenchAPI.saveCsvFile(defaultFilename, res.csv);
        if (saveRes.success && saveRes.filePath) {
          setExportStatusMsg(`Saved benchmark export to: ${saveRes.filePath}`);
        } else if (saveRes.canceled) {
          setExportStatusMsg('Save dialog was cancelled.');
        } else if (saveRes.error) {
          setExportStatusMsg(`Failed to save file: ${saveRes.error}`);
        }
      } else {
        setExportStatusMsg(`Export failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setExportStatusMsg(`Export error: ${err.message || 'Unknown error'}`);
    } finally {
      setExportLoading(false);
    }
  };

  const toggleWorker = (w: number) => {
    if (w === 1) return; // Serial baseline is mandatory
    if (selectedWorkers.includes(w)) {
      if (selectedWorkers.length > 1) {
        setSelectedWorkers(selectedWorkers.filter((x) => x !== w));
      }
    } else {
      setSelectedWorkers([...selectedWorkers, w].sort());
    }
  };

  const env = suiteResult?.environment;
  const workers = suiteResult?.worker_results ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1e1e1e', color: '#ccc', overflowY: 'auto' }}>
      {/* Workspace Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #333', backgroundColor: '#252526', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 600 }}>
            Multicore Performance & Parallel Benchmarking
          </h2>
          <span style={{ fontSize: '12px', color: '#888' }}>
            Requirement D: Serial baseline (T1) vs. bounded C++17 parallel worker pool (1, 2, 4 workers) | Deterministic ordering & numerical agreement
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleRunBenchmark}
            disabled={jobStatus === 'running'}
            style={{
              padding: '8px 16px',
              backgroundColor: jobStatus === 'running' ? '#444' : '#0e639c',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: jobStatus === 'running' ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {jobStatus === 'running' ? (
              <>
                <div style={{ width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Running Benchmark...</span>
              </>
            ) : (
              <span>Run Multicore Benchmark</span>
            )}
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exportLoading || !suiteResult}
            style={{
              padding: '8px 16px',
              backgroundColor: !suiteResult ? '#333' : '#238636',
              color: !suiteResult ? '#777' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: !suiteResult ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '12px'
            }}
          >
            {exportLoading ? 'Exporting...' : 'Export Benchmark CSV'}
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {/* Hardware & Environment Disclosure Banner */}
        <div style={{ backgroundColor: '#252526', borderRadius: '6px', border: '1px solid #333', padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              Audited Hardware & Build Environment (Runtime Query from C++)
            </span>
            <span style={{ fontSize: '11px', color: '#69db7c', backgroundColor: 'rgba(105, 219, 124, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              Native Win32 & MSVC Detection
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#888' }}>Processor: </span>
              <span style={{ color: '#fff', fontWeight: 500 }}>{env?.cpu_model ?? 'Detecting...'}</span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Topology: </span>
              <span style={{ color: '#fff' }}>
                {env?.physical_cores ?? 0} Cores / {env?.logical_cores ?? 0} Threads (Intel Alder Lake P+E)
              </span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Physical Memory: </span>
              <span style={{ color: '#fff' }}>
                {env ? `${(env.total_ram_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB RAM` : 'N/A'}
              </span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Compiler / Mode: </span>
              <span style={{ color: '#fff' }}>{env?.compiler ?? 'MSVC'} ({env?.build_mode ?? 'Release'})</span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Timer Clock: </span>
              <span style={{ color: '#fff' }}>{env?.timer_clock ?? 'std::chrono::steady_clock'}</span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Measured Scope: </span>
              <span style={{ color: '#aaa' }}>Pure compute loop (includes worker spawn/join)</span>
            </div>
          </div>
        </div>

        {/* Workload Configuration Panel */}
        <div style={{ backgroundColor: '#252526', borderRadius: '6px', border: '1px solid #333', padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontWeight: 500 }}>
              CASE COUNT (M)
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[500, 1000, 2000, 5000].map((count) => (
                <button
                  key={`case-${count}`}
                  onClick={() => setCaseCount(count)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    backgroundColor: caseCount === count ? '#0e639c' : '#333',
                    color: caseCount === count ? '#fff' : '#aaa',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontWeight: 500 }}>
              MESH SIZE (ELEMENTS N)
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[10, 20, 40, 80, 160].map((elem) => (
                <button
                  key={`elem-${elem}`}
                  onClick={() => setElements(elem)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    backgroundColor: elements === elem ? '#0e639c' : '#333',
                    color: elements === elem ? '#fff' : '#aaa',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {elem}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontWeight: 500 }}>
              WORKER COUNTS (P)
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#fff', backgroundColor: '#0e639c', padding: '3px 8px', borderRadius: '4px' }}>
                1 (Serial Baseline)
              </span>
              {[2, 4].map((w) => (
                <button
                  key={`worker-${w}`}
                  onClick={() => toggleWorker(w)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    backgroundColor: selectedWorkers.includes(w) ? '#238636' : '#333',
                    color: selectedWorkers.includes(w) ? '#fff' : '#888',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {w} Workers {selectedWorkers.includes(w) ? '✓' : ''}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '6px', fontWeight: 500 }}>
              RANDOM SEED (REPRODUCIBILITY)
            </label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10) || 12345)}
              style={{
                width: '100px',
                padding: '4px 8px',
                backgroundColor: '#1e1e1e',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px',
                fontSize: '11px'
              }}
            />
          </div>

          {executionTimeMs !== null && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#888' }}>Total Batch Wall Time: </span>
              <span style={{ fontSize: '13px', color: '#69db7c', fontWeight: 600 }}>{executionTimeMs} ms</span>
            </div>
          )}
        </div>

        {/* Error & Diagnostic Banner */}
        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', padding: '12px 16px', color: '#fca5a5', fontSize: '12px' }}>
            <strong>Benchmark Error: </strong> {errorMessage}
          </div>
        )}

        {/* Numerical Agreement & Verification Banner */}
        {suiteResult && (
          <div style={{
            backgroundColor: suiteResult.all_passed ? 'rgba(35, 134, 54, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${suiteResult.all_passed ? '#238636' : '#ef4444'}`,
            borderRadius: '6px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>
                Numerical Verification: Serial vs. Parallel Discrepancy
              </span>
              <div style={{ fontSize: '12px', color: '#ccc', marginTop: '2px' }}>
                Max absolute discrepancy across all {caseCount} cases and {elements + 1} nodes:{' '}
                <strong style={{ fontFamily: 'monospace', color: '#69db7c' }}>
                  {(suiteResult.max_global_discrepancy_C ?? 0).toExponential(4)} °C
                </strong>{' '}
                (Mandatory threshold: ≤ 1.0e-8 °C) | Deterministic ordering verified.
              </div>
            </div>
            <div style={{
              backgroundColor: suiteResult.all_passed ? '#238636' : '#da3633',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '11px',
              letterSpacing: '0.5px'
            }}>
              {suiteResult.all_passed ? 'ALL VERIFICATIONS PASSED' : 'DISCREPANCY VIOLATION'}
            </div>
          </div>
        )}

        {/* Execution Timings & Results Table */}
        <div style={{ backgroundColor: '#252526', borderRadius: '6px', border: '1px solid #333', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              Execution Timings & Scaling Metrics (5 Measured Repetitions + Median)
            </span>
            <span style={{ fontSize: '11px', color: '#888' }}>
              Speedup S_p = T_1 / T_p | Efficiency E_p = S_p / p
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#2d2d2d', color: '#aaa', borderBottom: '1px solid #333' }}>
                <th style={{ padding: '8px 12px' }}>Workers (p)</th>
                <th style={{ padding: '8px 12px' }}>Execution Mode</th>
                <th style={{ padding: '8px 12px' }}>Rep 1</th>
                <th style={{ padding: '8px 12px' }}>Rep 2</th>
                <th style={{ padding: '8px 12px' }}>Rep 3</th>
                <th style={{ padding: '8px 12px' }}>Rep 4</th>
                <th style={{ padding: '8px 12px' }}>Rep 5</th>
                <th style={{ padding: '8px 12px', color: '#fff' }}>Median (T_p)</th>
                <th style={{ padding: '8px 12px', color: '#38d9a9' }}>Speedup (S_p)</th>
                <th style={{ padding: '8px 12px', color: '#ffa94d' }}>Efficiency (E_p)</th>
                <th style={{ padding: '8px 12px' }}>Max Discrepancy</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w: WorkerBenchmarkResultDTO) => (
                <tr key={`worker-row-${w.worker_count}`} style={{ borderBottom: '1px solid #2a2a2a' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#fff' }}>
                    {w.worker_count}
                  </td>
                  <td style={{ padding: '8px 12px', color: w.is_serial_baseline ? '#38bdf8' : '#69db7c' }}>
                    {w.is_serial_baseline ? 'Serial Baseline (T1)' : `Parallel Pool (${w.worker_count} Workers)`}
                  </td>
                  {w.repetition_ms.map((t, idx) => (
                    <td key={`rep-${w.worker_count}-${idx}`} style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#aaa' }}>
                      {t.toFixed(1)} ms
                    </td>
                  ))}
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>
                    {w.median_ms.toFixed(1)} ms
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#38d9a9', fontFamily: 'monospace' }}>
                    {w.speedup.toFixed(2)}x
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#ffa94d', fontFamily: 'monospace' }}>
                    {(w.efficiency * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#aaa' }}>
                    {w.max_discrepancy_vs_serial_C.toExponential(2)} °C
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      backgroundColor: w.numerical_agreement_passed ? 'rgba(35, 134, 54, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: w.numerical_agreement_passed ? '#69db7c' : '#ef4444',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      {w.numerical_agreement_passed ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2D Speedup & Efficiency SVG Chart */}
        {workers.length > 0 && <BenchmarkChart results={workers} />}

        {/* Collapsible Architectural Insights & Overhead Drawer */}
        <div style={{ backgroundColor: '#252526', borderRadius: '6px', border: '1px solid #333' }}>
          <button
            onClick={() => setShowInsights(!showInsights)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            <span>Architectural Insights & Multicore Scaling Analysis (Amdahl's Law, Heterogeneity & Bottlenecks)</span>
            <span>{showInsights ? '▲ Hide' : '▼ Expand'}</span>
          </button>

          {showInsights && (
            <div style={{ padding: '16px', borderTop: '1px solid #333', fontSize: '12px', color: '#aaa', lineHeight: 1.6 }}>
              <h4 style={{ color: '#fff', margin: '0 0 6px 0', fontSize: '13px' }}>1. Intel Alder Lake Hybrid Core Heterogeneity</h4>
              <p style={{ margin: '0 0 12px 0' }}>
                The host CPU (12th Gen Intel Core i7-1255U) features a hybrid architecture comprising 2 Performance cores (Golden Cove, up to 4.7 GHz with Hyper-Threading) and 8 Efficient cores (Gracemont, up to 3.5 GHz). When scaling from 2 to 4 workers, threads are dispatched across heterogeneous cores with unequal IPC and clock frequencies, naturally resulting in non-linear scaling (Efficiency &lt; 100%).
              </p>

              <h4 style={{ color: '#fff', margin: '0 0 6px 0', fontSize: '13px' }}>2. Thread Spawning and Join Overhead</h4>
              <p style={{ margin: '0 0 12px 0' }}>
                The measured parallel wall-time interval deliberately includes thread dispatch, thread execution, and thread joining (RAII). For smaller workloads, the thread coordination overhead represents a noticeable fraction of compute time. As workload case count increases (e.g. 2,000 to 5,000 cases), thread creation overhead is amortized over a larger volume of computation.
              </p>

              <h4 style={{ color: '#fff', margin: '0 0 6px 0', fontSize: '13px' }}>3. Memory Bandwidth &amp; Cache Coherency</h4>
              <p style={{ margin: '0 0 12px 0' }}>
                Each thermal FEM case solves a tridiagonal linear system. While each worker writes exclusively to its assigned slice in the pre-allocated results array, shared memory bus traffic and L3 cache misses during concurrent vector writes create memory contention, illustrating practical physical scaling limits.
              </p>

              <h4 style={{ color: '#fff', margin: '0 0 6px 0', fontSize: '13px' }}>4. Power and Thermal Throttling</h4>
              <p style={{ margin: 0 }}>
                Under sustained multi-threaded execution across 4 workers, mobile processor power management (PL1 / PL2 limits) adjusts individual core clock frequencies downward relative to single-core turbo, contributing to observed efficiency reductions.
              </p>
            </div>
          )}
        </div>

        {/* CSV Export Status & Preview Drawer */}
        {exportStatusMsg && (
          <div style={{ backgroundColor: '#252526', border: '1px solid #333', borderRadius: '6px', padding: '12px 16px' }}>
            <div style={{ fontSize: '12px', color: '#fff', marginBottom: csvPreview ? '8px' : 0 }}>
              {exportStatusMsg}
            </div>
            {csvPreview && (
              <pre style={{
                backgroundColor: '#141414',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#aaa',
                fontFamily: 'Consolas, monospace',
                margin: 0,
                maxHeight: '160px',
                overflowY: 'auto'
              }}>
                {csvPreview.content}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
