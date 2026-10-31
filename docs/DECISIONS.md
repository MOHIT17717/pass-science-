# Architecture Decision Records

## ADR-001 — C++17+ engineering backend
**Status:** Accepted.  
C++17 or later owns numerical computation, engineering logic, authoritative file parsing, concurrency, embedded simulation logic, and backpropagation. This is an assignment requirement.

## ADR-002 — Electron + React desktop frontend
**Status:** Accepted; supersedes the previous Qt and Dear ImGui UI decisions.  
Use Electron for the Windows desktop shell and React + TypeScript for the renderer. The assignment allows frontend technology choice. This is a project design decision, not an assignment-mandated framework.

## ADR-003 — Three.js for 3D visualization
**Status:** Accepted.  
Use Three.js, optionally through React Three Fiber, to render C++-validated ASCII STL geometry and temperature point clouds. Do not implement a full CAD modeller.

## ADR-004 — 2D chart library
**Status:** Pending selection.  
Choose either Apache ECharts or Recharts after a small documented comparison of features, accessibility, data volume, export, bundle size, and licence. Use only one unless a justified gap exists.

## ADR-005 — Local C++ backend process
**Status:** Accepted in principle; transport details pending.  
Electron main starts and supervises a separate bundled C++ backend. The backend binds only to loopback and uses per-launch authentication. Choose HTTP framework, port strategy, and job progress transport in Task 05.

## ADR-006 — Secure Electron renderer
**Status:** Accepted.  
Use `nodeIntegration: false`, `contextIsolation: true`, sandboxing where compatible, restrictive CSP, narrow `contextBridge` APIs, validated IPC senders, restricted navigation, and no remote renderer content. Follow Electron's security guidance. See https://www.electronjs.org/docs/latest/tutorial/security/ and https://www.electronjs.org/docs/latest/tutorial/context-isolation/.

## ADR-007 — CMake and npm build separation
**Status:** Accepted.  
CMake builds C++ core/API/backend/tests. npm builds React/Electron assets. Packaging combines the renderer, Electron runtime, backend executable, runtime dependencies, examples and documentation.

## ADR-008 — Windows standalone packaging
**Status:** Accepted in principle.  
Use electron-builder as the candidate Windows packager, subject to version pinning and clean-machine validation. The final ZIP must extract and launch by double-clicking `Launch.exe`; no development tools, admin rights or internet at runtime.

## ADR-009 — Preserve verified FEM implementation
**Status:** Accepted.  
Existing FEM files and tests are preserved byte-for-byte until a separately approved task requires a change. Existing Qt UI files are legacy; do not compile or delete them without explicit approval.
