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
  MapPin,
  ExternalLink,
  Laptop,
  FolderDown,
  Play,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import releaseMeta from '@/data/release-metadata.json';

export default function ProfilePortfolio() {
  const [copiedSha, setCopiedSha] = useState(false);
  const shaChecksum = releaseMeta.sha256;

  const copyChecksum = () => {
    navigator.clipboard.writeText(shaChecksum);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2500);
  };

  const skills = [
    {
      category: 'Languages',
      items: ['C++', 'Python', 'Java', 'TypeScript', 'JavaScript', 'HTML/CSS'],
    },
    {
      category: 'Systems & Engineering',
      items: ['C++17', 'Finite Element Method (FEM)', 'Multi-threading', 'Embedded Simulators', 'IPC Architecture'],
    },
    {
      category: 'Frontend & Desktop',
      items: ['React 18', 'Next.js', 'Electron 33', 'Three.js / WebGL', 'Tailwind CSS'],
    },
    {
      category: 'AI & Data',
      items: ['Artificial Intelligence', 'Computer Vision', 'Neural Backpropagation', 'Numerical Algorithms'],
    },
  ];

  const projectModules = [
    {
      title: 'CAD 3D Viewport',
      icon: <Box className="w-4 h-4 text-cyan-400" />,
      desc: 'Three.js WebGL renderer parsing binary/ASCII STL meshes with normals & OrbitControls.',
      img: '/screenshots/cad_only_view.png',
    },
    {
      title: 'Thermal FEM Solver',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      desc: '2D heat conduction PDE solver in C++ validated against synthetic ANSYS benchmarks.',
      img: '/screenshots/thermal_results_view.png',
    },
    {
      title: 'Multicore Benchmark',
      icon: <Cpu className="w-4 h-4 text-blue-400" />,
      desc: '1, 2, and 4 worker threadpool scaling metrics analyzing Amdahl’s Law parallel speedup.',
      img: '/screenshots/performance_results_view.png',
    },
    {
      title: 'Hardware Mock Bus',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      desc: 'Real-time UART, SPI, and I2C telemetry stream with simulated timeout fault recovery.',
      img: '/screenshots/hardware_integration_view.png',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Download Package',
      desc: 'Click the download button to get CandidateID_Workbench.zip (~154.7 MB) from Vercel Blob.',
    },
    {
      num: '02',
      title: 'Extract Files',
      desc: 'Right-click the ZIP archive and select "Extract All..." to any local workspace or Desktop folder.',
    },
    {
      num: '03',
      title: 'Double-Click Launch.exe',
      desc: 'Double-click Launch.exe. The application initializes the C++ backend and UI immediately.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Top Profile Header Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-850 border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              MK
            </div>
            <div>
              <div className="font-bold text-white tracking-tight text-sm sm:text-base group-hover:text-cyan-400 transition-colors">
                Mohit S K
              </div>
              <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
                Software Engineer & Developer
              </div>
            </div>
          </a>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-5 text-xs font-mono text-slate-400">
              <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
              <a href="#project" className="hover:text-cyan-400 transition-colors">Project</a>
              <a href="#skills" className="hover:text-cyan-400 transition-colors">Skills</a>
              <a href="#how-to-run" className="hover:text-cyan-400 transition-colors">Run Guide</a>
            </nav>

            <a
              href={releaseMeta.downloadUrl}
              download={releaseMeta.fileName}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Profile Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* Developer Bio Card (Personal Profile Hero) */}
        <section id="about" className="relative rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-10 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start gap-8">
            {/* Avatar Profile Ring */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 p-0.5 shadow-xl shadow-cyan-500/20">
                <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    MK
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-950 border-2 border-slate-900 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 text-xs font-mono font-medium mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CREATOR & DEVELOPER</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Mohit S K
                </h1>
                <p className="text-base sm:text-lg text-cyan-300 font-mono mt-1 font-medium">
                  Software Engineering & Artificial Intelligence
                </p>
              </div>

              {/* Education & Location */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-400 pt-1">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                  <span>B.Tech CSE • SRM Institute of Science and Technology (2023–2027)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Chennai, India</span>
                </div>
              </div>

              {/* Bio Summary */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed pt-2">
                Passionate about <strong className="text-white">Software Engineering</strong>, <strong className="text-white">Artificial Intelligence</strong>, <strong className="text-white">Computer Vision</strong>, <strong className="text-white">Embedded Systems</strong>, and <strong className="text-white">Full-Stack Development</strong>. Experienced in building native C++ calculation engines, GPU-accelerated 3D WebGL interfaces, and secure desktop applications.
              </p>

              {/* Contact & Social Links */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <a
                  href="mailto:mohit17717@gmail.com"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
                >
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>mohit17717@gmail.com</span>
                </a>
                <a
                  href="mailto:ms1131@srmist.edu.in"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
                >
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>ms1131@srmist.edu.in</span>
                </a>
                <a
                  href="https://github.com/MOHIT17717"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
                >
                  <svg className="w-4 h-4 text-purple-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Project Showcase: Unified Engineering Workbench */}
        <section id="project" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-1">
                FLAGSHIP PROJECT
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Unified Engineering Workbench
              </h2>
            </div>
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
              v1.0.0 Production Release
            </span>
          </div>

          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              An authoritative multi-domain desktop engineering workbench developed in <strong className="text-white">C++17</strong> and <strong className="text-white">Electron/React</strong>. Combines 3D CAD visualization, 2D Thermal Finite Element Method (FEM) analysis, 4-worker multicore benchmarks, embedded hardware serial telemetry, and neural backpropagation inside a single self-contained portable Windows application.
            </p>

            {/* Combined Viewport Screenshot Preview */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative aspect-[16/9] shadow-2xl group">
              <img
                src="/screenshots/combined_overlay_view.png"
                alt="Unified Engineering Workbench Viewport"
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-md p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold">Launch.exe Live Viewport</span>
                <span className="text-slate-400 hidden sm:inline">3D Bracket STL + 2D Thermal Finite Element Overlay</span>
                <span className="text-emerald-400 font-semibold">100% Offline C++ Core</span>
              </div>
            </div>

            {/* 4 Feature Module Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {projectModules.map((m, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        {m.icon}
                      </div>
                      <h4 className="text-xs font-bold text-white">{m.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Direct Download Card (Highlight of the Project) */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>OFFICIAL STANDALONE SUBMISSION</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                    {releaseMeta.fileName}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Windows 11 x64 Standalone • Size: {releaseMeta.fileSizeFormatted} ({releaseMeta.fileSize.toLocaleString()} bytes)
                  </p>
                </div>

                <a
                  href={releaseMeta.downloadUrl}
                  download={releaseMeta.fileName}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-sm font-bold shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <Download className="w-5 h-5" />
                  <span>Download ZIP</span>
                </a>
              </div>

              {/* SHA-256 Checksum Box */}
              <div className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="text-slate-400">
                  <span className="text-slate-200 font-bold uppercase text-[10px]">Verified SHA-256: </span>
                  <span className="text-cyan-400 break-all select-all">{shaChecksum}</span>
                </div>
                <button
                  onClick={copyChecksum}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 shrink-0 transition-colors"
                >
                  {copiedSha ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Hash</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Skills & Capabilities Section */}
        <section id="skills" className="space-y-6">
          <div>
            <div className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-1">
              EXPERTISE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Skills & Tech Stack
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {skills.map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  {s.category}
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.items.map((item, iIdx) => (
                    <span
                      key={iIdx}
                      className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How to Run the Package Section */}
        <section id="how-to-run" className="space-y-6">
          <div>
            <div className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-1">
              EXECUTION GUIDE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              How to Run the Application
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              100% portable Windows package. Zero external dependencies, compilers, or interpreters required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((st, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono font-bold text-sm flex items-center justify-center mb-4">
                    {st.num}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{st.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Windows Defender SmartScreen notice */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-amber-500/30 flex items-start gap-3.5 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-slate-300 leading-relaxed">
              <span className="font-bold text-white">Windows Defender SmartScreen Notice: </span>
              Because this is an independent build without an expensive EV certificate, Windows 11 may show <em className="text-amber-300">&ldquo;Windows protected your PC&rdquo;</em>. Simply click <strong className="text-white">&ldquo;More info&rdquo;</strong> then <strong className="text-white">&ldquo;Run anyway&rdquo;</strong>.
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="mt-20 py-8 border-t border-slate-850 border-slate-800 text-center text-xs font-mono text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} Mohit S K • SRM Institute of Science and Technology
          </div>
          <div className="text-slate-400">
            Unified Engineering Workbench (v1.0.0 Standalone Distribution)
          </div>
        </div>
      </footer>
    </div>
  );
}
