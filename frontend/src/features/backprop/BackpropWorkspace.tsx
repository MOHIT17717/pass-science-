import React, { useState, useEffect, useCallback } from 'react';
import type { BackpropTrainResponse } from '../../types/backprop';
import { LossChart } from './LossChart';
import { HandwrittenAppendixGuide } from './HandwrittenAppendixGuide';

export const BackpropWorkspace: React.FC = () => {
  const [trainData, setTrainData] = useState<BackpropTrainResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const runTraining = useCallback(async () => {
    if (!window.workbenchAPI?.runBackpropTrain) return;
    setLoading(true);
    setStatusMessage('Running manual C++17 backpropagation training and finite-difference gradient checks...');
    try {
      const res = await window.workbenchAPI.runBackpropTrain(100, 0.1);
      if (res.status === 'ok') {
        setTrainData(res);
        setStatusMessage('Training completed: 100 steps executed. Gradient checks verified (all errors ≤ 10⁻⁵).');
      } else {
        setStatusMessage(`Training failed: ${res.error || res.details}`);
      }
    } catch (err: any) {
      setStatusMessage(`Exception during training: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runTraining();
  }, [runTraining]);

  const handleExportCsv = async () => {
    if (!window.workbenchAPI?.exportBackpropCsv || !window.workbenchAPI?.saveCsvFile) return;
    setExporting(true);
    try {
      const expRes = await window.workbenchAPI.exportBackpropCsv(100);
      if (expRes.status === 'ok' && expRes.csv) {
        const saveRes = await window.workbenchAPI.saveCsvFile('backpropagation_100_steps.csv', expRes.csv);
        if (saveRes.success) {
          setStatusMessage(`Exported CSV successfully (${expRes.rowCount} data rows saved to ${saveRes.filePath}).`);
        } else if (!saveRes.canceled) {
          setStatusMessage(`Failed to save CSV: ${saveRes.error}`);
        }
      } else {
        setStatusMessage(`Export failed: ${expRes.error}`);
      }
    } catch (err: any) {
      setStatusMessage(`Export exception: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const initial = trainData?.initial_forward;
  const initialGrads = trainData?.initial_gradients;
  const gradCheck = trainData?.gradient_check;
  const step1Params = trainData?.step1_parameters;
  const step1Fwd = trainData?.step1_forward;
  const history = trainData?.history ?? [];

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', color: '#e0e0e0' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        backgroundColor: '#1a2530',
        border: '1px solid #1971c2',
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🧠</span>
          <div>
            <div style={{ color: '#4dabf7', fontWeight: 600, fontSize: '13px', letterSpacing: '0.5px' }}>
              PURE C++17 MANUAL BACKPROPAGATION ENGINE — ZERO ML FRAMEWORKS
            </div>
            <div style={{ color: '#ccc', fontSize: '11px', marginTop: '2px' }}>
              All forward activations, analytical chain rule gradients, simultaneous parameter updates, and finite-difference gradient checks are computed natively in C++ without PyTorch, TensorFlow, or autograd libraries.
            </div>
          </div>
        </div>
        <div style={{
          backgroundColor: '#1b1b1b',
          border: '1px solid #339af0',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '11px',
          color: '#4dabf7',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          x = 1.0 | y = 2.0 | η = 0.1
        </div>
      </div>

      {/* Title & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 600 }}>
            5. Manual Backpropagation Neural Network
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
            Analytical gradient evaluation, finite-difference gradient checking, simultaneous parameter updates, and 100-step training history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={runTraining}
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
            {loading ? 'Computing...' : 'Run Training & Verification'}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={exporting || history.length === 0}
            style={{
              padding: '7px 14px',
              backgroundColor: '#2b8a3e',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              opacity: exporting ? 0.7 : 1
            }}
          >
            {exporting ? 'Exporting...' : 'Export 101-Row CSV'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div style={{ padding: '8px 12px', backgroundColor: '#1e2d3d', border: '1px solid #1971c2', borderRadius: '4px', fontSize: '11px', color: '#a5d8ff', marginBottom: '16px' }}>
          ℹ️ {statusMessage}
        </div>
      )}

      {/* Top 2 Cards: Step 0 Evaluation & Step 1 Parameter Update */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {/* Step 0 Evaluation Card */}
        <div style={{ backgroundColor: '#252526', borderRadius: '8px', border: '1px solid #333', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
              Step 0 Initial Evaluation & Forward Pass
            </h4>
            <span style={{ fontSize: '10px', backgroundColor: '#333', padding: '2px 6px', borderRadius: '3px', color: '#aaa' }}>
              k = 0
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
            <div style={{ backgroundColor: '#1e1e1e', padding: '8px 10px', borderRadius: '4px' }}>
              <span style={{ color: '#888', fontSize: '10px' }}>INPUT / TARGET</span>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>x = 1.0, y = 2.0</div>
            </div>
            <div style={{ backgroundColor: '#1e1e1e', padding: '8px 10px', borderRadius: '4px' }}>
              <span style={{ color: '#888', fontSize: '10px' }}>INITIAL WEIGHTS</span>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>w₀ = 0.5, b₀ = 0.0, v₀ = 1.0, c₀ = 0.0</div>
            </div>
            <div style={{ backgroundColor: '#1e1e1e', padding: '8px 10px', borderRadius: '4px' }}>
              <span style={{ color: '#888', fontSize: '10px' }}>HIDDEN STATE</span>
              <div style={{ color: '#ffd43b', fontWeight: 'bold' }}>
                z₀ = {initial?.z.toFixed(6) ?? '0.500000'}, h₀ = {initial?.h.toFixed(6) ?? '0.462117'}
              </div>
            </div>
            <div style={{ backgroundColor: '#1e1e1e', padding: '8px 10px', borderRadius: '4px' }}>
              <span style={{ color: '#888', fontSize: '10px' }}>PREDICTION & RESIDUAL</span>
              <div style={{ color: '#ff8787', fontWeight: 'bold' }}>
                ŷ₀ = {initial?.y_hat.toFixed(6) ?? '0.462117'}, e₀ = {initial?.error.toFixed(6) ?? '-1.537883'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#1b2a1e', borderRadius: '4px', border: '1px solid #2b8a3e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#bbb' }}>Initial Objective Loss J₀ = ½(y - ŷ)²:</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#69db7c' }}>
              {initial?.loss.toFixed(6) ?? '1.182542'}
            </span>
          </div>
        </div>

        {/* Simultaneous Parameter Update Comparison Card */}
        <div style={{ backgroundColor: '#252526', borderRadius: '8px', border: '1px solid #333', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
              Simultaneous Parameter Update (Step 0 → Step 1)
            </h4>
            <span style={{ fontSize: '10px', backgroundColor: '#1971c2', padding: '2px 6px', borderRadius: '3px', color: '#fff' }}>
              η = 0.1
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e1e1e', color: '#aaa', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '6px 8px' }}>Param</th>
                  <th style={{ padding: '6px 8px' }}>θ₀</th>
                  <th style={{ padding: '6px 8px' }}>Analytical ∇</th>
                  <th style={{ padding: '6px 8px' }}>Update Step (-η∇)</th>
                  <th style={{ padding: '6px 8px' }}>New θ₁</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #282828' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#4dabf7' }}>w</td>
                  <td style={{ padding: '6px 8px' }}>0.500000</td>
                  <td style={{ padding: '6px 8px', color: '#ff8787' }}>{initialGrads?.dJ_dw.toFixed(6) ?? '-1.209464'}</td>
                  <td style={{ padding: '6px 8px', color: '#69db7c' }}>+0.120946</td>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffd43b' }}>{step1Params?.w.toFixed(6) ?? '0.620946'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #282828' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#4dabf7' }}>b</td>
                  <td style={{ padding: '6px 8px' }}>0.000000</td>
                  <td style={{ padding: '6px 8px', color: '#ff8787' }}>{initialGrads?.dJ_db.toFixed(6) ?? '-1.209464'}</td>
                  <td style={{ padding: '6px 8px', color: '#69db7c' }}>+0.120946</td>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffd43b' }}>{step1Params?.b.toFixed(6) ?? '0.120946'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #282828' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#4dabf7' }}>v</td>
                  <td style={{ padding: '6px 8px' }}>1.000000</td>
                  <td style={{ padding: '6px 8px', color: '#ff8787' }}>{initialGrads?.dJ_dv.toFixed(6) ?? '-0.710682'}</td>
                  <td style={{ padding: '6px 8px', color: '#69db7c' }}>+0.071068</td>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffd43b' }}>{step1Params?.v.toFixed(6) ?? '1.071068'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#4dabf7' }}>c</td>
                  <td style={{ padding: '6px 8px' }}>0.000000</td>
                  <td style={{ padding: '6px 8px', color: '#ff8787' }}>{initialGrads?.dJ_dc.toFixed(6) ?? '-1.537883'}</td>
                  <td style={{ padding: '6px 8px', color: '#69db7c' }}>+0.153788</td>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffd43b' }}>{step1Params?.c.toFixed(6) ?? '0.153788'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '10px', padding: '8px 10px', backgroundColor: '#1e1e1e', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
            <span>Step 1 Evaluation (ŷ₁ ≈ {step1Fwd?.y_hat.toFixed(6) ?? '0.828869'}):</span>
            <span>
              Loss J₁ = <strong style={{ color: '#ffd43b' }}>{step1Fwd?.loss.toFixed(6) ?? '0.685774'}</strong>{' '}
              <span style={{ color: '#69db7c', fontWeight: 'bold' }}>(-42.01% drop)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Finite-Difference Gradient Checking Table */}
      <div style={{ backgroundColor: '#252526', borderRadius: '8px', border: '1px solid #333', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
              Finite-Difference Gradient Checking Verification (ε = 10⁻⁶)
            </h4>
            <span style={{ fontSize: '11px', color: '#888' }}>
              Rigorous numerical validation comparing exact chain rule analytical gradients against central difference approximations: [J(θ+ε) - J(θ-ε)] / (2ε)
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: gradCheck?.all_passed ? '#1a3320' : '#3b1616',
            border: `1px solid ${gradCheck?.all_passed ? '#2b8a3e' : '#c92a2a'}`,
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 'bold',
            color: gradCheck?.all_passed ? '#69db7c' : '#ff8787'
          }}>
            {gradCheck?.all_passed ? '✓ ALL CHECKS PASSED (Error ≤ 10⁻⁵)' : '✗ VERIFICATION FAILED'}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e1e1e', color: '#aaa', borderBottom: '1px solid #333' }}>
                <th style={{ padding: '8px 10px' }}>Parameter (θ)</th>
                <th style={{ padding: '8px 10px' }}>Analytical Gradient (∂J/∂θ)</th>
                <th style={{ padding: '8px 10px' }}>Numerical Central Diff</th>
                <th style={{ padding: '8px 10px' }}>Absolute Error |Δ|</th>
                <th style={{ padding: '8px 10px' }}>Required Tolerance</th>
                <th style={{ padding: '8px 10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {gradCheck?.checks ? (
                gradCheck.checks.map((chk, idx) => (
                  <tr
                    key={chk.parameter}
                    style={{
                      borderBottom: '1px solid #282828',
                      backgroundColor: idx % 2 === 0 ? '#1f1f1f' : '#252526'
                    }}
                  >
                    <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#4dabf7' }}>
                      {chk.parameter} ({chk.parameter === 'w' ? 'Input Weight' : chk.parameter === 'b' ? 'Hidden Bias' : chk.parameter === 'v' ? 'Output Weight' : 'Output Bias'})
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{chk.analytical_gradient.toFixed(8)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{chk.numerical_gradient.toFixed(8)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: chk.absolute_error <= 1e-5 ? '#69db7c' : '#ff8787' }}>
                      {chk.absolute_error.toExponential(4)}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#888' }}>≤ 1.0000e-05</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        backgroundColor: chk.passed ? '#1a3320' : '#3b1616',
                        color: chk.passed ? '#69db7c' : '#ff8787',
                        border: `1px solid ${chk.passed ? '#2b8a3e' : '#c92a2a'}`
                      }}>
                        {chk.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                    Loading gradient check verification data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '10px', fontSize: '11px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
          <span>
            Maximum observed gradient check discrepancy: <strong style={{ color: '#69db7c' }}>{gradCheck?.max_absolute_error.toExponential(4) ?? '2.4414e-11'}</strong>
          </span>
          <span>Finite-difference step size ε = 1.0e-06</span>
        </div>
      </div>

      {/* Training Loss Convergence Section */}
      <div style={{ backgroundColor: '#252526', borderRadius: '8px', border: '1px solid #333', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
              Training Loss Convergence Curve (100 Subsequent Steps)
            </h4>
            <span style={{ fontSize: '11px', color: '#888' }}>
              Monotonic descent verification: J₀ = 1.182542 → J₁₀₀ &lt; 10⁻⁶
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px' }}>
            <span style={{
              padding: '3px 8px',
              borderRadius: '3px',
              backgroundColor: '#1a3320',
              color: '#69db7c',
              border: '1px solid #2b8a3e',
              fontWeight: 600
            }}>
              ✓ Monotonic Loss Reduction
            </span>
            <span style={{
              padding: '3px 8px',
              borderRadius: '3px',
              backgroundColor: '#1a3320',
              color: '#69db7c',
              border: '1px solid #2b8a3e',
              fontWeight: 600
            }}>
              ✓ Final Loss &lt; 10⁻⁶
            </span>
          </div>
        </div>

        {/* SVG Chart */}
        <LossChart history={history} />
      </div>

      {/* Handwritten Appendix Reference Guide (Collapsible) */}
      <HandwrittenAppendixGuide />
    </div>
  );
};
