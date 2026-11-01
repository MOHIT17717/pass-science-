'use client';

import React from 'react';
import { ShieldCheck, Cpu, Terminal, Layers, Lock, Zap } from 'lucide-react';

export const ProductOverview: React.FC = () => {
  const pillars = [
    {
      icon: <Cpu className="w-6 h-6 text-cyan-400" />,
      title: 'Authoritative C++17 Engineering Core',
      tagline: 'All numerical algorithms execute in native compiled code',
      description:
        'The C++ backend (uew_backend.exe) performs all heavy engineering tasks: finite element assembly, sparse linear system solving, multicore worker scheduling, serial bus timing simulation, and neural gradient descent. The frontend never computes authoritative physics.',
      badges: ['Compiled C++17', 'Eigen / Sparse Algebra', 'OpenMP / std::thread', 'Zero JS Solvers'],
    },
    {
      icon: <Layers className="w-6 h-6 text-blue-400" />,
      title: 'Hardware-Accelerated 3D Presentation',
      tagline: 'WebGL & Three.js visualization inside sandboxed Electron shell',
      description:
        'Binary STL geometry parsing, normal vector computation, and smooth scalar temperature colormapping (Turbo / Jet gradients) render directly on the client GPU. Interactive OrbitControls provide responsive inspection of dense CAD meshes.',
      badges: ['Electron 33 Shell', 'React 18 + TypeScript', 'Three.js Viewport', 'GPU Colormap Shaders'],
    },
    {
      icon: <Lock className="w-6 h-6 text-emerald-400" />,
      title: 'Isolated Loopback IPC Security Architecture',
      tagline: 'Local loopback binding with per-launch cryptographic authentication',
      description:
        'The backend binds strictly to the loopback address 127.0.0.1 on a randomly allocated ephemeral port. Every IPC request requires a 256-bit cryptographic token generated at launch. Absolutely zero inbound/outbound internet connections are initiated.',
      badges: ['127.0.0.1 Loopback Only', '256-bit Random Token', 'contextIsolation: true', 'No Remote Calls'],
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: 'Zero-Prerequisite Portable Windows Distribution',
      tagline: 'Single top-level Launch.exe with bundled runtime DLLs',
      description:
        'Packaged with bundled Microsoft Visual C++ v143 runtime DLLs (vcruntime140.dll, msvcp140.dll) and an integrated Chromium/Node runtime. Operates out-of-the-box on clean Windows 11 x64 systems without requiring Visual Studio, CMake, Python, or npm.',
      badges: ['Bundled MSVC CRT', 'Zero Installers', 'No Admin / UAC Needed', 'Clean Machine Validated'],
    },
  ];

  return (
    <section id="overview" className="py-24 bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono font-semibold rounded mb-3">
            ARCHITECTURAL SPECIFICATION
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed for Deterministic Engineering & Isolated Security
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Unified Engineering Workbench decouples presentation from calculation through a clear boundary: the React/Electron UI serves purely as a reactive control cockpit and 3D visualization canvas, while an independent native C++ service computes all physics, simulations, and threadpool tasks.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  {pillar.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{pillar.title}</h3>
                <div className="text-xs font-mono text-cyan-400 mb-4">{pillar.tagline}</div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{pillar.description}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-900">
                {pillar.badges.map((b, bIdx) => (
                  <span
                    key={bIdx}
                    className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Process Topology / Architecture Flow */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-8 sm:p-10 shadow-2xl">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-8">
            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                PROCESS BOUNDARY & EXECUTION TOPOLOGY
              </div>
              <h3 className="text-xl font-bold text-white mt-1">Inter-Process Architecture</h3>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-md">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographically Isolated</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
            {/* Box 1: Electron UI Shell */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 relative">
              <div className="text-xs font-mono text-blue-400 font-bold mb-1">01 • PRESENTATION LAYER</div>
              <h4 className="text-lg font-bold text-white mb-2">Electron & React Shell</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Executes inside a sandboxed Chromium renderer with nodeIntegration disabled. Communicates only via typed preload contextBridge.
              </p>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Three.js WebGL CAD Viewport
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Recharts Telemetry Dashboards
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Zero Node.js Privileges in React
                </div>
              </div>
            </div>

            {/* Box 2: IPC Bridge */}
            <div className="bg-slate-900/80 border border-cyan-900/40 rounded-xl p-6 relative flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold mb-1">02 • LOCAL TRANSPORT</div>
                <h4 className="text-lg font-bold text-white mb-2">Loopback IPC Channel</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  All commands transit through a dedicated loopback HTTP/REST link bound to 127.0.0.1 on an ephemeral port.
                </p>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                <div className="text-cyan-400 font-semibold">Header: X-Session-Token</div>
                <div className="text-slate-400">Host: 127.0.0.1:[ephemeral_port]</div>
                <div className="text-emerald-400">External Network: Disabled</div>
              </div>
            </div>

            {/* Box 3: C++ Backend */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 relative">
              <div className="text-xs font-mono text-emerald-400 font-bold mb-1">03 • ENGINEERING CORE</div>
              <h4 className="text-lg font-bold text-white mb-2">uew_backend.exe (C++17)</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Independent compiled native binary supervised by Launch.exe. Receives simulation requests and dispatches multicore tasks.
              </p>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  2D Heat Equation Solver (FEM)
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  4-Worker Threadpool Scheduler
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Bus Protocol Simulators (UART/SPI/I2C)
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Native Matrix Neural Backpropagation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
