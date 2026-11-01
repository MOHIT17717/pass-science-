'use client';

import React from 'react';
import { Monitor, Cpu, HardDrive, ShieldCheck, Activity } from 'lucide-react';

export const SystemRequirements: React.FC = () => {
  const specs = [
    {
      category: 'Operating System',
      min: 'Windows 11 64-bit (Build 22000+) or Windows 10 64-bit (Build 19045+)',
      rec: 'Windows 11 64-bit (Version 22H2 / 23H2 / 24H2)',
      notes: 'Standard user privileges. No administrative elevation required.',
    },
    {
      category: 'Processor (CPU)',
      min: 'Dual-core 64-bit x86 processor (Intel Core / AMD Ryzen)',
      rec: 'Quad-core or higher x86-64 processor',
      notes: 'Multicore module features threadpool scaling up to 4 concurrent worker threads.',
    },
    {
      category: 'System Memory (RAM)',
      min: '4 GB RAM',
      rec: '8 GB RAM or higher',
      notes: 'Measured base memory consumption: ~185 MB total across Electron shell and C++ engine.',
    },
    {
      category: 'Storage Space',
      min: '500 MB free NTFS disk space',
      rec: '1 GB free SSD disk space',
      notes: '162 MB compressed ZIP archive; 340 MB uncompressed directory footprint.',
    },
    {
      category: 'Graphics / GPU',
      min: 'DirectX 11 or OpenGL 3.3 capable GPU (Intel HD 520+ / AMD / NVIDIA)',
      rec: 'Dedicated GPU with WebGL 2.0 hardware acceleration',
      notes: 'Powers Three.js 3D viewport, CAD mesh rendering, and gradient color interpolation.',
    },
    {
      category: 'Display Resolution',
      min: '1366 × 768 pixels',
      rec: '1920 × 1080 (Full HD) or 2560 × 1440',
      notes: 'Responsive multi-pane layout with collapsable parameter and telemetry sidebars.',
    },
    {
      category: 'Network & Connectivity',
      min: 'None (100% Offline)',
      rec: 'None (100% Offline)',
      notes: 'All IPC communication is restricted to local loopback (127.0.0.1) using ephemeral tokens.',
    },
  ];

  return (
    <section id="requirements" className="py-24 bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono font-semibold rounded mb-3">
            SPECIFICATIONS & COMPATIBILITY
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Verified System Requirements
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Unified Engineering Workbench has been empirically validated on clean-install Windows 11 64-bit systems.
          </p>
        </div>

        {/* Requirements Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl mb-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-xs font-mono uppercase text-slate-400 tracking-wider">
                <th className="py-4 px-6 font-semibold w-1/4">Hardware / OS Component</th>
                <th className="py-4 px-6 font-semibold w-1/3">Minimum Specification</th>
                <th className="py-4 px-6 font-semibold w-1/3">Recommended Specification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {specs.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-bold text-white">
                    <div>{item.category}</div>
                    <div className="text-xs text-slate-400 font-normal mt-0.5">{item.notes}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-300 font-mono text-xs">
                    {item.min}
                  </td>
                  <td className="py-4 px-6 text-cyan-400 font-mono text-xs font-semibold">
                    {item.rec}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Technical Callouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              Bundled Microsoft Visual C++ Runtimes
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              The application directory embeds <code className="text-cyan-400 font-mono text-xs font-semibold">vcruntime140.dll</code>, <code className="text-cyan-400 font-mono text-xs font-semibold">msvcp140.dll</code>, and required MSVC 14.3x CRT components inside <code className="text-slate-300 font-mono text-xs">bin/</code>. It runs smoothly on clean Windows installations without requiring the Microsoft Visual C++ Redistributable package installer.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Isolated IPC Security Architecture
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              The high-performance C++ backend (<code className="text-slate-300 font-mono text-xs">uew_backend.exe</code>) binds exclusively to the loopback interface (<code className="text-cyan-400 font-mono text-xs font-semibold">127.0.0.1</code>) on a randomly allocated ephemeral port. Every request is verified via a per-launch cryptographically random 256-bit authentication token.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

