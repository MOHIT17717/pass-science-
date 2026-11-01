import React, { useState } from 'react';

export const HandwrittenAppendixGuide: React.FC = () => {
  const [expanded, setExpanded] = useState<boolean>(true);

  return (
    <div style={{ backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333', padding: '18px', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', fontWeight: 600 }}>
            2-Page Handwritten Appendix Reference Guide
          </h4>
          <span style={{ fontSize: '11px', color: '#888' }}>
            Complete analytical derivations, chain rule steps, and exact numerical checkpoints matching the assignment specification
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '4px 10px',
            backgroundColor: '#333',
            color: '#4dabf7',
            border: '1px solid #444',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 500
          }}
        >
          {expanded ? '▲ Collapse Reference' : '▼ Expand Reference Guide'}
        </button>
      </div>

      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', marginTop: '14px' }}>
          {/* Page 1 Derivations */}
          <div style={{ backgroundColor: '#252526', borderRadius: '6px', border: '1px solid #333', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3a', paddingBottom: '6px', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffd43b' }}>
                PAGE 1: ARCHITECTURE & FORWARD EVALUATION (STEP 0)
              </span>
              <span style={{ fontSize: '10px', color: '#888' }}>Initial State</span>
            </div>

            <div style={{ fontSize: '11px', lineHeight: 1.6, color: '#ccc' }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Network Topology:</strong> Scalar input x = 1.0, hidden activation tanh(z), linear output ŷ, scalar target y = 2.0. Learning rate η = 0.1.
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Initial Parameter Values:</strong><br />
                <code style={{ color: '#4dabf7' }}>w₀ = 0.5, b₀ = 0.0, v₀ = 1.0, c₀ = 0.0</code>
              </p>
              <div style={{ backgroundColor: '#181818', padding: '8px 10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', border: '1px solid #282828' }}>
                <div>1. Hidden Pre-activation:</div>
                <div style={{ color: '#ffd43b' }}>z = w·x + b = (0.5)(1.0) + 0.0 = 0.500000</div>
                <div style={{ marginTop: '4px' }}>2. Hidden Activation:</div>
                <div style={{ color: '#ffd43b' }}>h = tanh(z) = tanh(0.5) ≈ 0.462117</div>
                <div style={{ marginTop: '4px' }}>3. Network Prediction:</div>
                <div style={{ color: '#ffd43b' }}>ŷ = v·h + c = (1.0)(0.462117) + 0.0 ≈ 0.462117</div>
                <div style={{ marginTop: '4px' }}>4. Residual Error:</div>
                <div style={{ color: '#ff8787' }}>e = ŷ - y = 0.462117 - 2.0 = -1.537883</div>
                <div style={{ marginTop: '4px' }}>5. Objective Loss:</div>
                <div style={{ color: '#69db7c' }}>J = ½ e² = ½ (-1.537883)² ≈ 1.182542</div>
              </div>
            </div>
          </div>

          {/* Page 2 Derivations */}
          <div style={{ backgroundColor: '#252526', borderRadius: '6px', border: '1px solid #333', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3a3a3a', paddingBottom: '6px', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffd43b' }}>
                PAGE 2: ANALYTICAL GRADIENTS & SIMULTANEOUS UPDATE
              </span>
              <span style={{ fontSize: '10px', color: '#888' }}>Backpropagation</span>
            </div>

            <div style={{ fontSize: '11px', lineHeight: 1.6, color: '#ccc' }}>
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Chain Rule Analytical Gradients:</strong>
              </p>
              <div style={{ backgroundColor: '#181818', padding: '8px 10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', border: '1px solid #282828' }}>
                <div>• ∂J/∂c = e = -1.537883</div>
                <div>• ∂J/∂v = e·h = (-1.537883)(0.462117) ≈ -0.710682</div>
                <div>• ∂h/∂z = 1 - h² ≈ 1 - 0.462117² ≈ 0.786448</div>
                <div>• ∂J/∂b = e·v·(1 - h²) = (-1.537883)(1.0)(0.786448) ≈ -1.209464</div>
                <div>• ∂J/∂w = e·v·(1 - h²)·x = (-1.209464)(1.0) ≈ -1.209464</div>
              </div>

              <p style={{ margin: '8px 0 4px 0' }}>
                <strong>Simultaneous Parameter Updates (η = 0.1):</strong>
              </p>
              <div style={{ backgroundColor: '#181818', padding: '6px 10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px', color: '#69db7c', border: '1px solid #282828' }}>
                <div>w₁ = w₀ - η(∂J/∂w) = 0.5 - 0.1(-1.209464) = 0.620946</div>
                <div>b₁ = b₀ - η(∂J/∂b) = 0.0 - 0.1(-1.209464) = 0.120946</div>
                <div>v₁ = v₀ - η(∂J/∂v) = 1.0 - 0.1(-0.710682) = 1.071068</div>
                <div>c₁ = c₀ - η(∂J/∂c) = 0.0 - 0.1(-1.537883) = 0.153788</div>
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#a5d8ff' }}>
                <strong>Step 1 Loss:</strong> J₁ ≈ <strong>0.685774</strong> (Drop: <strong>-42.01%</strong> from J₀=1.182542).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
