'use client';

import React from 'react';
import { Download, ChevronRight, ShieldCheck, Cpu, Flame, Layers, Box, Terminal } from 'lucide-react';
import releaseMeta from '@/data/release-metadata.json';

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background Blueprint Grid Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Release status badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-cyan-400 text-xs font-mono font-medium mb-8 backdrop-blur-sm shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>PRODUCTION RELEASE v1.0.0</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">WINDOWS 11 x64 STANDALONE</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            Multi-Domain Engineering, <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Unified in a Single Workbench.
            </span>
          </h1>

          {/* Subtitle description */}
          <p className="mt-6 text-base sm:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
            A high-performance Windows 11 desktop workbench combining <strong className="text-white font-semibold">3D CAD visualization</strong>, <strong className="text-white font-semibold">2D Thermal FEM simulation</strong>, <strong className="text-white font-semibold">multicore threadpool distribution</strong>, <strong className="text-white font-semibold">embedded hardware telemetry</strong>, and <strong className="text-white font-semibold">neural backpropagation</strong> in a single, 100% self-contained application.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={releaseMeta.downloadUrl}
              download={releaseMeta.fileName}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-sm font-bold shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              <span>Download {releaseMeta.fileName} ({releaseMeta.fileSizeFormatted})</span>
            </a>
            <a
              href="#gallery"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-mono text-sm font-semibold transition-all hover:text-white"
            >
              <span>Inspect Application Screenshots</span>
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </a>
          </div>

          {/* Architectural highlights pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono text-slate-400">
            <span className="px-3 py-1 rounded-md bg-slate-800/60 border border-slate-700/50">
              ⚡ Native C++17 Engine
            </span>
            <span className="px-3 py-1 rounded-md bg-slate-800/60 border border-slate-700/50">
              🔒 100% Offline Loopback IPC
            </span>
            <span className="px-3 py-1 rounded-md bg-slate-800/60 border border-slate-700/50">
              📦 Zero External Dependencies
            </span>
            <span className="px-3 py-1 rounded-md bg-slate-800/60 border border-slate-700/50">
              🧊 Three.js 3D Viewport
            </span>
          </div>
        </div>

        {/* Hero Preview Card: CAD & Thermal Overlay in Action */}
        <div className="mt-16 max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-3 sm:p-4 shadow-2xl shadow-cyan-950/40">
          <div className="flex items-center justify-between pb-3 px-3 border-b border-slate-800 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="ml-2 font-semibold text-slate-300">Launch.exe — CAD & Thermal FEM Integration Viewport</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-[11px]">
              <span className="text-cyan-400">STL: sample_bracket.stl</span>
              <span className="text-emerald-400">Grid: 21×21 (441 Nodes)</span>
              <span className="text-amber-400">IPC: 127.0.0.1 (Loopback)</span>
            </div>
          </div>

          <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/10]">
            <img
              src="/screenshots/combined_overlay_view.png"
              alt="Unified Engineering Workbench CAD & Thermal Overlay Viewport"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
                <span className="text-slate-300 font-bold">Active Dual-Pane Viewport</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">3D CAD Mesh Registered with Finite Element Thermal Field</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-rose-400 font-semibold">T_max: 92.4 °C</span>
                <span className="text-sky-400 font-semibold">T_min: 25.0 °C</span>
                <span className="text-emerald-400 font-semibold">RMS Error vs Synthetic: 1.42%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Quantitative Metrics */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-black text-cyan-400 font-mono">5</div>
            <div className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">Engineering Domains</div>
            <div className="text-[11px] text-slate-500 mt-1">CAD, FEM, Multicore, Hardware, ML</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-black text-emerald-400 font-mono">&lt; 1.8s</div>
            <div className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">Cold Launch Time</div>
            <div className="text-[11px] text-slate-500 mt-1">Automated supervised C++ spawn</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-black text-sky-400 font-mono">4-Worker</div>
            <div className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">Threadpool Scaling</div>
            <div className="text-[11px] text-slate-500 mt-1">C++ atomic task scheduling</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 text-center">
            <div className="text-3xl font-black text-amber-400 font-mono">0 KB</div>
            <div className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">External Downloads</div>
            <div className="text-[11px] text-slate-500 mt-1">Self-contained bundled MSVC runtimes</div>
          </div>
        </div>
      </div>
    </section>
  );
};

