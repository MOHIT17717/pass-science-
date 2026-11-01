'use client';

import React, { useState } from 'react';
import { Download, CheckCircle2, ShieldCheck, Copy, Check, FileCode, Layers, Info, Zap } from 'lucide-react';
import releaseMeta from '@/data/release-metadata.json';

export const DownloadSection: React.FC = () => {
  const [copiedSha, setCopiedSha] = useState(false);
  const shaChecksum = releaseMeta.sha256;

  const copyChecksum = () => {
    navigator.clipboard.writeText(shaChecksum);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2500);
  };

  return (
    <section id="download" className="py-24 bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono font-semibold rounded mb-3">
            VERIFIED PRODUCTION RELEASE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Download Unified Engineering Workbench
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            The standalone production ZIP is hosted on high-performance Vercel Blob edge storage. Packaged with the compiled C++17 engine, Electron shell, and MSVC runtime dependencies.
          </p>
        </div>

        {/* Release Package Card */}
        <div className="max-w-4xl mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-8 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono font-semibold mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>CLEAN-MACHINE VALIDATED BUILD</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {releaseMeta.fileName}
              </h3>
              <p className="text-slate-400 text-sm mt-1 font-mono">
                Version {releaseMeta.version} • {releaseMeta.platform} Standalone Distribution
              </p>
            </div>

            <div className="text-left lg:text-right shrink-0">
              <div className="text-2xl font-black text-white font-mono">{releaseMeta.fileSizeFormatted}</div>
              <div className="text-xs text-slate-500 font-mono">{releaseMeta.fileSize.toLocaleString()} bytes</div>
            </div>
          </div>

          {/* Package Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Primary Executable</div>
              <div className="text-sm font-mono font-bold text-slate-200 mt-1 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>Launch.exe (Root)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Architecture</div>
              <div className="text-sm font-mono font-bold text-slate-200 mt-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Windows 11 x64</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Storage CDN</div>
              <div className="text-sm font-mono font-bold text-emerald-400 mt-1 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Vercel Blob Global Edge</span>
              </div>
            </div>
          </div>

          {/* Checksum Box */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                Official SHA-256 Checksum (Verified):
              </span>
              <button
                onClick={copyChecksum}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-semibold transition-colors"
              >
                {copiedSha ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Checksum Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Full Hash</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-xs text-cyan-400 break-all bg-slate-950 p-3 rounded-xl border border-slate-800 select-all">
              {shaChecksum}
            </div>
          </div>

          {/* Download CTA Action */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href={releaseMeta.downloadUrl}
              download={releaseMeta.fileName}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-sm font-bold shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Download className="w-5 h-5" />
              <span>Download {releaseMeta.fileName} ({releaseMeta.fileSizeFormatted})</span>
            </a>
            <a
              href="#installation"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-mono text-xs font-semibold border border-slate-700 text-center transition-colors"
            >
              View Installation Guide
            </a>
          </div>

          {/* Edge Storage Notice */}
          <div className="mt-6 flex items-start gap-2.5 text-xs font-mono text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Direct high-speed download hosted on Vercel Blob storage. Verified byte-for-byte against the master build checksum prior to publication.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
