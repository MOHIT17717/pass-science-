'use client';

import React, { useState } from 'react';
import { Download, Copy, Check, ShieldAlert, CheckCircle2, Cpu, Zap, Lock, Terminal } from 'lucide-react';
import releaseMeta from '@/data/release-metadata.json';

export const InstallationGuide: React.FC = () => {
  const [copiedSha, setCopiedSha] = useState(false);
  const shaChecksum = releaseMeta.sha256;

  const copyChecksum = () => {
    navigator.clipboard.writeText(shaChecksum);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2500);
  };

  return (
    <section id="installation" className="py-24 bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono font-semibold rounded mb-3">
            DEPLOYMENT PROCEDURE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Windows Installation Guide
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Unified Engineering Workbench is packaged as an entirely self-contained portable Windows application. There are no installer wizards, registry keys, administrator rights, or external dependencies required.
          </p>
        </div>

        {/* 3 Step Workflow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Step 1 */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-mono font-bold text-xl flex items-center justify-center mb-6">
                01
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Download ZIP Package</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Download the official submission archive <a href={releaseMeta.downloadUrl} className="text-cyan-400 hover:underline bg-cyan-950/60 px-1.5 py-0.5 rounded font-mono text-xs">{releaseMeta.fileName}</a> (~{releaseMeta.fileSizeFormatted}).
              </p>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 break-all mb-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-sans">Official SHA-256 Checksum:</div>
                <div className="text-cyan-400 font-semibold">{shaChecksum.slice(0, 32)}...</div>
              </div>
            </div>
            <button
              onClick={copyChecksum}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-semibold transition-colors"
            >
              {copiedSha ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Checksum Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Full SHA-256 Hash</span>
                </>
              )}
            </button>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-mono font-bold text-xl flex items-center justify-center mb-6">
                02
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Extract Archive</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Right-click the ZIP archive and select <strong className="text-slate-200">Extract All...</strong> to any local directory (e.g., <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono text-xs">C:\Engineering\Workbench\</code> or your Desktop).
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Confirm the extracted directory contains the top-level <code className="text-cyan-400 font-mono text-xs font-bold">Launch.exe</code> alongside internal runtime binaries.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Uncompressed footprint: ~340 MB
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-mono font-bold text-xl flex items-center justify-center mb-6">
                03
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Double-Click Launch.exe</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Double-click <strong className="text-slate-200">Launch.exe</strong>. The custom bootstrap launcher validates the local runtime environment, spawns the supervised C++ engine, creates a loopback session token, and opens the UI shell.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Starts directly in standard unprivileged user space.
              </p>
            </div>
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for Immediate Production Use</span>
            </div>
          </div>
        </div>

        {/* Windows SmartScreen Guidance */}
        <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-6 sm:p-8 mb-16 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">
                Windows Defender SmartScreen Notice
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                Because this application is an independent engineering release distributed without a commercial EV code-signing certificate, Windows 11 SmartScreen may display: <em className="text-amber-300 font-semibold">&ldquo;Windows protected your PC&rdquo;</em>.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-amber-300 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/60">
                <span>Click &ldquo;More info&rdquo;</span>
                <span>→</span>
                <span>Click &ldquo;Run anyway&rdquo;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zero Prerequisites Matrix */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl">
          <div className="max-w-2xl mb-8">
            <div className="text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase mb-2">
              ZERO EXTERNAL DEPENDENCY COMMITMENT
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              No Build Tools, Compilers, or Interpreters Required
            </h3>
            <p className="text-slate-400 text-sm mt-2">
              Validated on clean-install Windows 11 64-bit machines without any pre-existing developer tooling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-rose-400 font-mono text-sm font-semibold mb-1">✕ No Node.js or npm</div>
              <div className="text-xs text-slate-400">Bundled standalone Electron runtime powers the UI presentation natively.</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-rose-400 font-mono text-sm font-semibold mb-1">✕ No Visual Studio or CMake</div>
              <div className="text-xs text-slate-400">C++ binary is pre-compiled for Windows 11 x64 architecture.</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-rose-400 font-mono text-sm font-semibold mb-1">✕ No Python or ML Runtimes</div>
              <div className="text-xs text-slate-400">Backpropagation neural engine is implemented in native C++.</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-rose-400 font-mono text-sm font-semibold mb-1">✕ No Internet or Cloud Services</div>
              <div className="text-xs text-slate-400">100% offline local loopback architecture. Never transmits external telemetry.</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-rose-400 font-mono text-sm font-semibold mb-1">✕ No Administrator Privileges</div>
              <div className="text-xs text-slate-400">Runs within normal unprivileged standard user permissions.</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-emerald-400 font-mono text-sm font-semibold mb-1">✓ Bundled MSVC v143 DLLs</div>
              <div className="text-xs text-slate-400">Includes vcruntime140.dll & msvcp140.dll; no VCRedist installer needed.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

