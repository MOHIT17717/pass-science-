# Unified Engineering Workbench (UEW)

The **Unified Engineering Workbench** is a high-performance desktop engineering application combining an Electron desktop shell, React 18 + TypeScript user interface, Three.js 3D visualization, and a C++17 native engineering core.

It provides a unified interface for 1D Finite Element Method (FEM) thermal simulation, interactive CAD geometry and temperature point cloud inspection, multicore performance benchmarking, host-side embedded hardware simulation, and analytical backpropagation neural network training.

---

## Architecture Overview

The system strictly decouples user presentation from numerical computation:

```
┌─────────────────────────────────────────────────────────────┐
│                       Electron Shell                        │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │    React + Three.js   │       │     Electron Main     │  │
│  │   Frontend Renderer   │◄─────►│    Process Manager    │  │
│  │ (Three.js / SVG / TS) │  IPC  │  (Security / Token)   │  │
│  └───────────────────────┘       └──────────┬────────────┘  │
└─────────────────────────────────────────────┼───────────────┘
                                              │ Loopback HTTP
                                              │ (Authenticated)
                                              ▼
                                   ┌─────────────────────┐
                                   │  C++17 Engineering  │
                                   │   Backend Daemon    │
                                   │  (uew_backend.exe)  │
                                   │  • 1D FEM Solver    │
                                   │  • STL / CSV Parsers│
                                   │  • Benchmark Engine │
                                   │  • Embedded Mocks   │
                                   │  • Backprop Engine  │
                                   └─────────────────────┘
```

### Key Technical Pillars
1. **Frontend**: React 18, TypeScript, Three.js interactive 3D viewport (orbit controls, node raycasting, camera presets, opacity fading), and reactive SVG vector charts.
2. **Desktop Shell**: Electron with hardened security:
   - `nodeIntegration: false`, `contextIsolation: true`, renderer sandboxing.
   - Restrictive Content Security Policy (CSP).
   - Strict sender validation on all IPC channels.
   - Lifecycle supervision of the C++ daemon (stdin token handshake, loopback-only binding, graceful SIGTERM/SHUTDOWN exit).
3. **Engineering Core (C++17)**:
   - **Thermal FEM Solver**: 1D steady-state heat conduction solver with second-order $\mathcal{O}(h^2)$ spatial convergence verification across mesh refinements.
   - **Geometry & Cloud Parsers**: Robust ASCII STL parser and synthetic ANSYS thermal point cloud CSV parser with boundary checks and NaN/Inf sanitization.
   - **Multicore Benchmark Suite**: Multithreaded parametric thermal analysis with bounded concurrency, Amdahl's Law speedup calculations, and zero-numerical-discrepancy validation.
   - **Embedded Hardware Simulation**: Host-side models for STMicroelectronics NUCLEO-F401RE MCU, Digilent Basys 3 FPGA, and SEGGER J-Link debugging interface with deterministic telemetry, fault injection, and fault isolation.
   - **Analytical Backpropagation Engine**: 2-layer neural network implemented in pure C++17 with central difference gradient checks ($\epsilon \le 10^{-5}$), Adam/SGD optimization, and CSV export.

---

## System Requirements & Prerequisites

- **Operating System**: Microsoft Windows 10 / 11 x64 (64-bit).
- **C++ Compiler**: Microsoft Visual Studio 2022 or Visual Studio Build Tools with the **C++ x64/x86 build tools** component (`vcvars64.bat`).
- **CMake**: Version 3.20 or newer (tested with CMake 3.28+ and 4.x).
- **Node.js**: Version 18.0.0 or newer (Node 22 LTS recommended).
- **npm**: Version 9.0.0 or newer.

---

## Quick Start: One-Command Development

From a fresh terminal in the project root:

```powershell
npm run dev
```

The unified development launcher (`scripts/dev-launcher.js`) automatically:
1. Verifies the Windows x64 platform and environment prerequisites.
2. Auto-discovers the MSVC compiler toolchain via `vswhere.exe` and locates `vcvars64.bat`.
3. Auto-discovers CMake from system `PATH` or standard installation directories.
4. Executes an incremental build of the C++ backend daemon (`build/Release/uew_backend.exe`).
5. Compiles Electron TypeScript (`dist/electron/main/index.js`).
6. Starts the Vite development server on `http://127.0.0.1:5173/` and polls for HTTP readiness.
7. Launches Electron, which establishes a secure stdin token handshake with `uew_backend.exe`.
8. Cleans up all child processes (Vite, Electron, C++ backend) on application exit or Ctrl+C.

---

## Build, Test, and Verification Commands

### C++ Core & API Test Suite
Run the 7 automated CTest test suites (core, thermal, parser, benchmark, embedded, backprop, API):

```powershell
ctest --test-dir build -C Release --output-on-failure
```

### TypeScript Validation & Production Build
```powershell
# Typecheck both renderer and Electron codebases
npm run typecheck

# Full production build (backend, renderer, and Electron main/preload)
npm run build
```

### Headless Verification & Screenshot Automation
To execute the automated end-to-end integration suite across all 5 workspaces:

```powershell
node scripts/dev-launcher.js --test-verify --test-autoclose=25000
```

Captured screenshots are automatically written to `docs/screenshots/`:
- `cad_only_view.png`
- `temperature_only_view.png`
- `node_inspection_view.png`
- `combined_overlay_view.png`
- `thermal_results_view.png`
- `performance_results_view.png`
- `hardware_integration_view.png`
- `backpropagation_results_view.png`

---

## Scope Disclaimers & Design Boundaries

1. **Host-Side Hardware Simulation**: Embedded devices (NUCLEO-F401RE, Digilent Basys 3, SEGGER J-Link) are host-side deterministic mock models simulating register states, telemetry streams, and fault conditions. The workbench does not perform physical JTAG wiring, pin probing, or physical board flashing.
2. **ASCII STL Geometry**: The CAD viewer imports and renders 3D triangular surface meshes formatted as ASCII STL. It is a visual inspection viewer and does not provide full parametric CAD solid modeling or STEP/IGES format conversion.
3. **Synthetic ANSYS Cloud**: The point cloud parser loads spatial temperature coordinates tagged with `is_synthetic: true`. It demonstrates point cloud registration and raycasting inspection without claiming to be a proprietary binary ANSYS database export.
4. **Analytical Backpropagation Engine**: The neural network solver is implemented entirely from mathematical first principles in C++17 with analytical calculus, gradient verification, and CSV export without external runtime machine learning dependencies.
