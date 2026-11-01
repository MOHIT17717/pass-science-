'use client';

import React, { useState } from 'react';
import {
  Download,
  Layers,
  Cpu,
  Box,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  User,
  Mail,
  GraduationCap,
  Code2,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  FileCode,
  Zap,
} from 'lucide-react';
import releaseMeta from '@/data/release-metadata.json';

export default function PortfolioPage() {
  const [copiedSha, setCopiedSha] = useState(false);
  const shaChecksum = releaseMeta.sha256;

  const copyChecksum = () => {
    navigator.clipboard.writeText(shaChecksum);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2500);
  };

  const techStack = [
    {
      name: 'C++17 Engine',
      category: 'Authoritative Core',
      description:
        'All engineering calculations, 2D thermal finite element equations, multicore threadpool task scheduling, serial bus simulators, and neural backpropagation run in native compiled C++.',
      highlights: ['FEM Solver', 'Multicore Pool', 'Serial Simulators', 'Backpropagation'],
    },
    {
      name: 'Electron 33',
      category: 'Desktop Shell',
      description:
        'Secure desktop container supervising the backend lifecycle with contextIsolation enabled, nodeIntegration disabled, and local loopback IPC authentication.',
      highlights: ['Sandboxed Renderer', 'Process Lifecycle', 'Ephemeral Loopback IPC'],
    },
    {
      name: 'React 18 & TypeScript',
      category: 'Frontend Cockpit',
      description:
        'Modern, typed, responsive dashboard interface providing reactive telemetry updates, parameter configuration controls, and real-time visualization.',
      highlights: ['Strict Typing', 'Modular Workspace UI', 'Dynamic Dashboards'],
    },
    {
      name: 'Three.js & WebGL',
      category: '3D Visualization',
      description:
        'Hardware-accelerated 3D viewport rendering STL geometry meshes, surface normals, bounding box centroids, and dynamic scalar temperature gradient overlays.',
      highlights: ['Binary STL Parsing', 'OrbitControls', 'GPU Thermal Shaders'],
    },
  ];

  const howToRunSteps = [
    {
      step: '01',
      title: 'Download the Package',
      description:
        'Click the download button to get CandidateID_Workbench.zip (~154.7 MB) directly from high-speed storage.',
    },
    {
      step: '02',
      title: 'Extract All Files',
      description:
        'Right-click the downloaded ZIP archive and choose "Extract All..." to any folder (e.g. Desktop or C:\\Workbench\\).',
    },
    {
      step: '03',
      title: 'Double-Click Launch.exe',
      description:
        'Open the extracted folder and run Launch.exe. The application automatically starts the C++ engine and opens the interface.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-base sm:text-lg">
                Unified Engineering Workbench
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
                v1.0.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-400">
              <a href="#how-to-run" className="hover:text-cyan-400 transition-colors">How to Run</a>
              <a href="#tech-stack" className="hover:text-cyan-400 transition-colors">Tech Stack</a>
              <a href="#developer" className="hover:text-cyan-400 transition-colors">Developer</a>
              <a href="#download" className="hover:text-cyan-400 transition-colors">Download</a>
            </nav>

            <a
              href={releaseMeta.downloadUrl}
              download={releaseMeta.fileName}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold font-mono tracking-wide shadow-md shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Download ZIP</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 text-xs font-mono font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>STANDALONE WINDOWS 11 APPLICATION</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Unified Engineering Workbench
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            A standalone desktop engineering application combining <strong className="text-white">3D CAD visualization</strong>, <strong className="text-white">2D Thermal FEM simulation</strong>, <strong className="text-white">multicore benchmarks</strong>, <strong className="text-white">hardware telemetry</strong>, and <strong className="text-white">neural backpropagation</strong> in a single portable package.
          </p>

          {/* Primary Download Button */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={releaseMeta.downloadUrl}
              download={releaseMeta.fileName}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-sm font-bold shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              <span>Download {releaseMeta.fileName} ({releaseMeta.fileSizeFormatted})</span>
            </a>
            <a
              href="#how-to-run"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs font-semibold border border-slate-800 transition-colors"
            >
              How to Run Guide
            </a>
          </div>

          {/* Quick Info Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-400">
            <span className="px-3 py-1 rounded-md bg-slate-900 border border-slate-800">
              ⚡ Native C++17 Core
            </span>
            <span className="px-3 py-1 rounded-md bg-slate-900 border border-slate-800">
              🧊 Three.js 3D Viewport
            </span>
            <span className="px-3 py-1 rounded-md bg-slate-900 border border-slate-800">
              🔒 100% Offline (No Cloud Required)
            </span>
            <span className="px-3 py-1 rounded-md bg-slate-900 border border-slate-800">
              📦 Zero Prerequisites (No Node/Python/CMake)
            </span>
          </div>
        </div>
      </section>

      {/* How to Run the Package Section */}
      <section id="how-to-run" className="py-20 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-2">
              GETTING STARTED
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              How to Run the Package
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              The application is 100% portable and self-contained. No installer wizards, administrative privileges, or software prerequisites are needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {howToRunSteps.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 font-mono font-bold text-lg flex items-center justify-center mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Windows SmartScreen Notice */}
          <div className="p-5 rounded-xl bg-slate-950 border border-amber-500/30 flex items-start gap-4">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-white">Windows Defender SmartScreen Notice: </span>
              Because this is an independent build without an expensive EV code-signing certificate, Windows 11 may show a blue prompt stating <em className="text-amber-300">&ldquo;Windows protected your PC&rdquo;</em>. Simply click <strong className="text-white">&ldquo;More info&rdquo;</strong> then <strong className="text-white">&ldquo;Run anyway&rdquo;</strong>.
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech-stack" className="py-20 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-2">
              ENGINEERING FOUNDATION
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tech Stack
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Architected with a strict separation between high-performance compiled physics and a modern desktop presentation layer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {techStack.map((tech, idx) => (
              <div
                key={idx}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-white">{tech.name}</h3>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                    {tech.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{tech.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80">
                  {tech.highlights.map((h, hIdx) => (
                    <span
                      key={hIdx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About the Developer Section ("Who Developed It") */}
      <section id="developer" className="py-20 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-2">
              CREATOR & AUTHOR
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              About the Developer
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Designed and implemented as an independent engineering workbench project.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-cyan-500/20">
                MK
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">Mohit S K</h3>
                <p className="text-sm font-mono text-cyan-400 mt-0.5">
                  Software Engineering & Artificial Intelligence
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-mono">
                  <GraduationCap className="w-4 h-4 text-slate-500" />
                  <span>B.Tech in Computer Science & Engineering (2023–2027)</span>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  SRM Institute of Science and Technology
                </div>
              </div>
            </div>

            {/* Profile Summary & Interests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>Technical Interests</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Software Engineering, Artificial Intelligence, Computer Vision, Embedded Systems, and Full-Stack Architecture.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Languages & Technologies</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  C++, Python, Java, React, TypeScript, Node.js, Electron, Three.js, and AI/ML technologies.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Primary Email</div>
                  <a
                    href="mailto:mohit17717@gmail.com"
                    className="text-xs font-mono font-semibold text-slate-200 hover:text-cyan-400 transition-colors"
                  >
                    mohit17717@gmail.com
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">College Email</div>
                  <a
                    href="mailto:ms1131@srmist.edu.in"
                    className="text-xs font-mono font-semibold text-slate-200 hover:text-cyan-400 transition-colors"
                  >
                    ms1131@srmist.edu.in
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Download Section */}
      <section id="download" className="py-20 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-2">
              STANDALONE DISTRIBUTION
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Download Package
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
              Download the complete standalone Windows ZIP archive with all binaries, samples, and MSVC runtime dependencies.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-xl max-w-2xl mx-auto">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-extrabold text-white font-mono">
                  {releaseMeta.fileName}
                </h3>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  Version {releaseMeta.version} • {releaseMeta.platform}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-white">
                  {releaseMeta.fileSizeFormatted}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {releaseMeta.fileSize.toLocaleString()} bytes
                </div>
              </div>
            </div>

            {/* Checksum Box */}
            <div className="my-6 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                <span className="text-slate-400 font-bold uppercase text-[10px]">
                  Verified SHA-256 Checksum:
                </span>
                <button
                  onClick={copyChecksum}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors text-[11px]"
                >
                  {copiedSha ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-xs text-cyan-400 break-all select-all">
                {shaChecksum}
              </div>
            </div>

            {/* Direct Download Button */}
            <a
              href={releaseMeta.downloadUrl}
              download={releaseMeta.fileName}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-sm font-bold shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Download className="w-5 h-5" />
              <span>Download {releaseMeta.fileName}</span>
            </a>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-500 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Includes Launch.exe, C++ Backend, Sample Bracket & Runtime DLLs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-10 bg-slate-950 text-slate-500 text-xs font-mono text-center">
        <div className="max-w-4xl mx-auto px-4">
          <div>
            Unified Engineering Workbench • Developed by Mohit S K (SRMIST)
          </div>
          <div className="mt-1 text-slate-600">
            Standalone Windows 11 x64 Engineering Software
          </div>
        </div>
      </footer>
    </div>
  );
}
