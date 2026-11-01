'use client';

import React from 'react';
import { Layers, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                <Layers className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                Unified Engineering Workbench
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              An authoritative multi-domain desktop engineering workbench uniting 3D CAD visualization, 2D Thermal Finite Element Analysis, multicore workload distribution, embedded serial bus telemetry, and neural backpropagation in a 100% self-contained Windows application.
            </p>
            <div className="text-xs font-mono text-cyan-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Windows 11 x64 Standalone Production Release</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">
              Sections
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a href="#overview" className="hover:text-cyan-400 transition-colors">Architecture Overview</a>
              </li>
              <li>
                <a href="#modules" className="hover:text-cyan-400 transition-colors">Engineering Modules</a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-cyan-400 transition-colors">Application Screenshots</a>
              </li>
              <li>
                <a href="#guides" className="hover:text-cyan-400 transition-colors">Operator User Guides</a>
              </li>
              <li>
                <a href="#installation" className="hover:text-cyan-400 transition-colors">Installation Guide</a>
              </li>
              <li>
                <a href="#requirements" className="hover:text-cyan-400 transition-colors">System Requirements</a>
              </li>
              <li>
                <a href="#download" className="hover:text-cyan-400 transition-colors">Download Package</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Architectural Security */}
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">
              Security Notice
            </h4>
            <div className="space-y-3 text-xs leading-relaxed text-slate-400 font-sans">
              <p>
                All numerical algorithms and physical simulations execute exclusively on local client hardware via the bundled C++17 binary.
              </p>
              <p className="font-mono text-[11px] text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>100% Offline Loopback IPC</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            © {new Date().getFullYear()} Unified Engineering Workbench • Developed by Mohit S K
          </div>
          <div className="text-slate-500">
            Self-Contained Windows 11 x64 Binary Distribution
          </div>
        </div>
      </div>
    </footer>
  );
};

