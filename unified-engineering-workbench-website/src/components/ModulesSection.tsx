'use client';

import React, { useState } from 'react';
import { Box, Flame, Cpu, Radio, Network, Download, CheckCircle2, ChevronRight, Activity, ArrowRight } from 'lucide-react';

export const ModulesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const modules = [
    {
      id: 'cad',
      name: 'CAD 3D Viewport',
      icon: <Box className="w-5 h-5 text-cyan-400" />,
      tagline: 'Hardware-Accelerated 3D Geometry Rendering',
      screenshot: '/screenshots/cad_only_view.png',
      alt: 'CAD 3D Viewport rendering STL bracket mesh',
      overview:
        'Parses standard binary and ASCII stereolithography (.stl) geometries directly on the client. Automatically calculates exact axis-aligned bounding boxes, surface normals, and vertex buffers for interactive GPU rendering via Three.js.',
      keyCapabilities: [
        'Binary & ASCII STL format parsing with automated header validation',
        'Computed centroid centering and automated camera target framing',
        'Interactive OrbitControls with zoom, pitch, yaw, and panning modes',
        'Toggleable wireframe overlay and surface shading presets',
        'Real-time triangle, face, and memory footprint metrics',
      ],
      technicalSpecs: [
        { label: 'Render Pipeline', value: 'Three.js / WebGL 2.0' },
        { label: 'Geometry Support', value: 'Binary & ASCII STL' },
        { label: 'Normal Calculation', value: 'Face & Vertex Averaging' },
        { label: 'Interaction FPS', value: '60 FPS Hardware VSync' },
      ],
    },
    {
      id: 'thermal',
      name: 'Thermal FEM Solver',
      icon: <Flame className="w-5 h-5 text-rose-400" />,
      tagline: '2D Finite Element Heat Equation & Synthetic ANSYS Comparison',
      screenshot: '/screenshots/thermal_results_view.png',
      alt: 'Thermal FEM solver temperature contour field and validation metrics',
      overview:
        'Computes steady-state 2D heat conduction across quadrilateral meshes using native C++ finite element assembly. Rigorously verified against synthetic ANSYS baseline data with quantitative L2 error norms and Pearson correlation.',
      keyCapabilities: [
        'Discretization of steady-state 2D conduction: ∇ · (k ∇T) + Q = 0',
        'Configurable boundary conditions: Dirichlet (fixed T) and Neumann (heat flux)',
        'Iterative sparse linear system solving executed entirely in C++',
        'Quantitative synthetic baseline validation: Max Error, L2 Norm, and Pearson r',
        'Complete nodal temperature field CSV export with coordinate indices',
      ],
      technicalSpecs: [
        { label: 'Governing PDE', value: '∇ · (k ∇T) + Q = 0' },
        { label: 'Solver Core', value: 'Native C++17 Sparse Assembly' },
        { label: 'Discretization', value: '4-Node Quad Elements' },
        { label: 'Verification', value: 'Pearson r > 0.99 vs Baseline' },
      ],
    },
    {
      id: 'multicore',
      name: 'Multicore Benchmark',
      icon: <Cpu className="w-5 h-5 text-blue-400" />,
      tagline: 'Threadpool Scaling & Amdahl’s Law Throughput Metrics',
      screenshot: '/screenshots/performance_results_view.png',
      alt: 'Multicore benchmarking threadpool scaling and execution latency',
      overview:
        'Demonstrates multi-threaded concurrency inside the native C++ engine. Dispatches compute-intensive matrix and numerical workloads across 1, 2, and 4 concurrent worker threads to empirically measure speedup factors and parallel efficiency.',
      keyCapabilities: [
        'Bounded native threadpool with atomic task queues and thread synchronization',
        'Empirical speedup benchmarking across 1, 2, and 4 concurrent worker threads',
        'Amdahl’s Law theoretical comparison curve against observed speedup',
        'Microsecond-accurate wall-clock execution timing and memory overhead tracking',
        'Detailed execution time, speedup factor, and efficiency metrics',
      ],
      technicalSpecs: [
        { label: 'Concurrency Core', value: 'std::thread / Atomic Queue' },
        { label: 'Worker Scaling', value: '1, 2, and 4 Threads' },
        { label: 'Benchmarking', value: 'Amdahl’s Law Speedup Model' },
        { label: 'Workload Chunking', value: 'Static & Dynamic Batching' },
      ],
    },
    {
      id: 'hardware',
      name: 'Hardware Mock Bus',
      icon: <Radio className="w-5 h-5 text-amber-400" />,
      tagline: 'Serial Protocol Telemetry & Fault Recovery Simulation',
      screenshot: '/screenshots/hardware_integration_view.png',
      alt: 'Embedded hardware mock bus telemetry and timeout recovery',
      overview:
        'Emulates real-world embedded sensor buses (UART, SPI, and I2C) in C++. Streams real-time telemetry packets, allows deterministic injection of communication timeouts, and demonstrates automatic protocol state-machine recovery.',
      keyCapabilities: [
        'Multi-protocol bus simulation: UART (configurable baud), SPI, and I2C',
        'Periodic telemetry streaming with checksum and CRC validation',
        'Interactive fault injection: simulated packet loss and bus timeout events',
        'Finite State Machine (FSM) timeout recovery and automatic retransmission',
        'Live rolling telemetry chart and raw hex communication log stream',
      ],
      technicalSpecs: [
        { label: 'Bus Protocols', value: 'UART, SPI, I2C Simulators' },
        { label: 'Timing Accuracy', value: 'Configurable Baud & Clock' },
        { label: 'Fault Handling', value: 'FSM Timeout Recovery' },
        { label: 'Telemetry Rate', value: '10 Hz - 100 Hz Streaming' },
      ],
    },
    {
      id: 'backprop',
      name: 'Neural Backpropagation',
      icon: <Network className="w-5 h-5 text-emerald-400" />,
      tagline: 'Native C++ Neural Gradient Descent & Loss Convergence',
      screenshot: '/screenshots/backpropagation_results_view.png',
      alt: 'Backpropagation training loss curve and weight matrix metrics',
      overview:
        'Implements a pure C++ multi-layer perceptron trained via backpropagation and gradient descent. No Python, TensorFlow, or PyTorch dependencies are involved. Tracks training loss convergence and allows complete CSV export of learned weights.',
      keyCapabilities: [
        'Feedforward architecture with configurable hidden layer dimensions',
        'Analytical backpropagation calculating exact layer-by-layer weight gradients',
        'Epoch-by-epoch Mean Squared Error (MSE) convergence tracking',
        'Configurable learning rate (η), momentum, and epoch termination thresholds',
        'Direct CSV export of learned weight matrices and bias vectors',
      ],
      technicalSpecs: [
        { label: 'Implementation', value: '100% Native C++ (No Python)' },
        { label: 'Algorithm', value: 'Backpropagation / SGD' },
        { label: 'Loss Metric', value: 'Mean Squared Error (MSE)' },
        { label: 'Weight Export', value: 'Structured CSV Matrix' },
      ],
    },
  ];

  const current = modules[activeTab];

  return (
    <section id="modules" className="py-24 bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono font-semibold rounded mb-3">
            TECHNICAL DOMAINS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Five Authoritative Engineering Modules
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Every module is powered directly by the supervised C++ engineering backend, delivering deterministic numerical accuracy and low-latency interaction.
          </p>
        </div>

        {/* Tab Buttons Bar */}
        <div className="flex flex-wrap gap-2 pb-6 border-b border-slate-800 mb-10">
          {modules.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all ${
                activeTab === idx
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {m.icon}
              <span>{m.name}</span>
            </button>
          ))}
        </div>

        {/* Active Module Showcase Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Details */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>MODULE {activeTab + 1} OF 5</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                  {current.name}
                </h3>
                <div className="text-sm font-mono text-slate-400 mb-6 font-medium">
                  {current.tagline}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  {current.overview}
                </p>

                {/* Key Capabilities List */}
                <div className="space-y-2.5 mb-8">
                  {current.keyCapabilities.map((cap, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2.5 text-xs text-slate-300 font-mono">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-800">
                {current.technicalSpecs.map((spec, sIdx) => (
                  <div key={sIdx} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">{spec.label}</div>
                    <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Verified Application Screenshot */}
            <div className="lg:col-span-6">
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl group">
                <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="text-slate-300 font-semibold">{current.name} Viewport Capture</span>
                  <span className="text-emerald-400 text-[11px]">100% Live Capture</span>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={current.screenshot}
                    alt={current.alt}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

