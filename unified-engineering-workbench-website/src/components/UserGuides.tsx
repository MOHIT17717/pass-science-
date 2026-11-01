'use client';

import React, { useState } from 'react';
import { Box, Flame, Cpu, Radio, Network, ChevronRight, CheckCircle2, Terminal } from 'lucide-react';

export const UserGuides: React.FC = () => {
  const [activeGuide, setActiveGuide] = useState(0);

  const guides = [
    {
      id: 'cad-guide',
      title: 'CAD 3D Viewport Workflow',
      icon: <Box className="w-5 h-5 text-cyan-400" />,
      steps: [
        {
          step: '01',
          name: 'Load STL Geometry',
          desc: 'Click "Load STL File" or click "Load Sample Bracket" to import the bundled bracket geometry. The binary parser automatically reads triangles and verifies surface normals.',
        },
        {
          step: '02',
          name: 'Interactive Navigation',
          desc: 'Left-click and drag to rotate the camera around the centroid. Right-click and drag to pan the viewport. Use the scroll wheel to zoom smoothly in and out.',
        },
        {
          step: '03',
          name: 'Display Modes & Centering',
          desc: 'Click "Recenter Camera" to re-align the model bounding box to the viewport center. Toggle "Wireframe Mode" to inspect underlying triangle tessellation.',
        },
      ],
      tip: 'The Three.js viewport utilizes hardware acceleration; frame rate metrics are displayed in real-time in the status bar.',
    },
    {
      id: 'thermal-guide',
      title: 'Thermal FEM Simulation Workflow',
      icon: <Flame className="w-5 h-5 text-rose-400" />,
      steps: [
        {
          step: '01',
          name: 'Configure Boundary Conditions',
          desc: 'Set the ambient temperature (e.g., 25.0 °C), fixed Dirichlet boundary temperatures (e.g., 100.0 °C on the heat source boundary), and thermal conductivity (k).',
        },
        {
          step: '02',
          name: 'Execute Native C++ Solver',
          desc: 'Click "Run Simulation". The C++ backend constructs the 4-node quad stiffness matrix, solves the linear system, and returns the nodal temperature distribution.',
        },
        {
          step: '03',
          name: 'Inspect Results & Comparative Baseline',
          desc: 'Review the maximum, minimum, and average temperatures. Inspect the synthetic ANSYS comparison metrics (L2 norm and Pearson correlation). Click "Export CSV" to save the full nodal grid.',
        },
      ],
      tip: 'Click on individual nodes in the temperature map to open the node inspector panel showing exact spatial coordinates and nodal temperatures.',
    },
    {
      id: 'multicore-guide',
      title: 'Multicore Threadpool Benchmarking',
      icon: <Cpu className="w-5 h-5 text-blue-400" />,
      steps: [
        {
          step: '01',
          name: 'Select Workload Complexity',
          desc: 'Choose the benchmark complexity (e.g., 500,000 to 2,000,000 matrix operations) to stress the underlying calculation core.',
        },
        {
          step: '02',
          name: 'Run Multi-Worker Benchmark',
          desc: 'Click "Run Benchmark". The C++ threadpool executes the batch workload sequentially on 1 worker, then in parallel on 2 and 4 worker threads.',
        },
        {
          step: '03',
          name: 'Analyze Speedup & Amdahl’s Law',
          desc: 'Inspect the resulting execution time chart. Compare observed speedup factors against theoretical Amdahl’s Law curves to assess parallel efficiency.',
        },
      ],
      tip: 'Tests are executed across isolated C++ worker threads to guarantee zero main-thread UI stuttering or frame drops.',
    },
    {
      id: 'hardware-guide',
      title: 'Embedded Hardware Bus & Fault Testing',
      icon: <Radio className="w-5 h-5 text-amber-400" />,
      steps: [
        {
          step: '01',
          name: 'Select Protocol & Connect',
          desc: 'Select UART, SPI, or I2C from the protocol dropdown. Click "Connect Bus". The backend initializes the simulated serial state machine.',
        },
        {
          step: '02',
          name: 'Stream Real-Time Telemetry',
          desc: 'Monitor incoming sensor data packets, CRC integrity checks, and live telemetry voltage/temperature charts updated at 10 Hz.',
        },
        {
          step: '03',
          name: 'Simulate Timeout & Verify Recovery',
          desc: 'Click "Inject Timeout Fault". Observe the bus state transition to TIMEOUT, followed by automatic retry retransmission and state-machine recovery.',
        },
      ],
      tip: 'Inspect the raw packet log in the lower terminal console to verify standard framing bytes, payloads, and checksum validations.',
    },
    {
      id: 'backprop-guide',
      title: 'Neural Backpropagation Training',
      icon: <Network className="w-5 h-5 text-emerald-400" />,
      steps: [
        {
          step: '01',
          name: 'Configure Hyperparameters',
          desc: 'Specify the hidden layer size, learning rate (η = 0.05 - 0.2), and total training epochs (e.g., 200 - 1000).',
        },
        {
          step: '02',
          name: 'Train Neural Network',
          desc: 'Click "Start Training". The native C++ engine computes analytical weight gradients and updates parameters via backpropagation gradient descent.',
        },
        {
          step: '03',
          name: 'Evaluate Convergence & Export',
          desc: 'Monitor the Mean Squared Error (MSE) loss descent curve. When converged, click "Export Weights CSV" to export the final weight matrices.',
        },
      ],
      tip: 'The entire neural training loop runs in compiled native C++ with zero external Python or PyTorch dependencies.',
    },
  ];

  const current = guides[activeGuide];

  return (
    <section id="guides" className="py-24 bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono font-semibold rounded mb-3">
            OPERATOR WORKFLOWS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Comprehensive Module User Guides
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Step-by-step procedures for operating all five analytical domains within the Unified Engineering Workbench application.
          </p>
        </div>

        {/* Guides Switcher */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Guide Selector List */}
          <div className="lg:col-span-4 space-y-2">
            {guides.map((g, idx) => (
              <button
                key={g.id}
                onClick={() => setActiveGuide(idx)}
                className={`w-full text-left p-4 rounded-xl border font-mono transition-all flex items-center justify-between ${
                  activeGuide === idx
                    ? 'bg-slate-800/80 border-cyan-500/50 text-white shadow-lg shadow-cyan-950/20'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {g.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{g.title}</div>
                    <div className="text-[10px] text-slate-500">Guide 0{idx + 1}</div>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    activeGuide === idx ? 'text-cyan-400 translate-x-1' : 'text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Active Guide Content */}
          <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
                <span>OPERATOR PROCEDURE</span>
                <span>•</span>
                <span>GUIDE 0{activeGuide + 1}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-8">{current.title}</h3>

              {/* Steps */}
              <div className="space-y-6 mb-8">
                {current.steps.map((st, sIdx) => (
                  <div key={sIdx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                      {st.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{st.name}</h4>
                      <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operator Tip Callout */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs font-mono">
              <Terminal className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-slate-400">
                <span className="text-slate-200 font-semibold">Operator Tip: </span>
                {current.tip}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

