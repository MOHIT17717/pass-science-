# Implementation plan — exactly 18 tasks

Execute one task at a time. No task begins without user approval. Task 01 and Task 02 may already be completed under the previous architecture; their evidence remains historical and must not be erased. This revision changes the approved architecture and the remaining plan. Reconcile statuses explicitly rather than pretending completed work was rerun.

| Task | Name | Scope and acceptance criteria |
|---|---|---|
| 01 | Environment audit | Record Windows, CPU/RAM/GPU, Git, C++ compiler, CMake, Node/npm, Antigravity, and packaging prerequisites. Distinguish absent from not found. Preserve actual evidence. |
| 02 | Requirements, architecture and traceability | Document Electron + React + Three.js + C++17 architecture, ADRs, security boundaries, API/packaging strategy; map all requirements and rubric criteria. Documentation only. |
| 03 | C++ toolchain, Git baseline and core build skeleton | Initialized Git baseline (commit ebac724); updated CMakeLists.txt for uew_core and tests; verified MSVC 19.51.36260 and CMake 4.5.0-rc2; built uew_core.lib and uew_core_tests.exe cleanly; CTest 100% passed (midpoint error 0.0195312 C). Status: PASSED. |
| 04 | Frontend/Electron workspace and dependency baseline | Established React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.10 + Electron 45.2.1 + Three.js 0.170.0 desktop shell; npm dependencies installed (146 packages, lockfile generated); separate tsconfigs for Electron and frontend; security baseline configured (`nodeIntegration: false`, `contextIsolation: true`, sandboxing, strict dynamic CSP, IPC sender frame validation); typecheck passed 0 errors; built Electron and React production bundles; verified window launch, React mount, preload `window.workbenchAPI` presence, and Three.js WebGL viewport initialization with clean auto-close. Status: PASSED. |
| 05 | C++ core and API boundary | Separate existing FEM/core from transport; choose and implement versioned local API, JSON DTOs, loopback/authentication and health endpoint. Core remains transport-free. |
| 06 | Thermal FEM verification and export | Verify equations, BCs, N=10/20/40/80, midpoint interpolation error, analytical comparison, convergence, CSV export and documented assumptions. |
| 07 | C++ STL and temperature CSV parsers | Implement strict ASCII STL and exact CSV schema parsing, validation, size limits, errors, fixtures and provenance. |
| 08 | React workbench shell and API integration | Build navigation, layout, forms, API client, progress/status/error surfaces; verify typed communication with C++ health endpoint. |
| 09 | Three.js geometry and temperature visualization | Render validated STL triangles and CSV point cloud; rotate/pan/zoom/fit, temperature legend and node inspection; units and synthetic label. |
| 10 | Thermal results and 2D plots | Display FEM curves, analytical comparison, convergence and exported result metadata; charts only visualize C++ results. |
| 11 | Background jobs, progress and cancellation | Add C++ job lifecycle, bounded work, progress, cancellation and safe result persistence; UI remains responsive. |
| 12 | Deterministic workload generator and serial baseline | Fixed-seed cases, positive varied k/q, configurable case count/mesh, serial results and reproducibility tests. |
| 13 | Bounded parallel worker pool | Parallel solves, worker counts 1/2/up to 4 capped by logical CPU, deterministic order and serial agreement <=1e-8 °C. |
| 14 | Benchmarking and performance evidence | Warm-up, five repetitions, medians, speedup/efficiency, CPU/RAM/compiler/build flags/workload, overhead analysis and plots. |
| 15 | Embedded design and C++ mock adapters | MCU, FPGA, JTAG adapter design; electrical table/diagram; simulated discovery/connect/disconnect/telemetry and recoverable timeout. |
| 16 | C++ manual backpropagation | Single sample, exact initial values, simultaneous update, finite-difference gradient check <=1e-5, 100-step loss history. |
| 17 | End-to-end integration, regression and usability | Integrate all modules; full automated tests; error/cancel paths; audit C++ owns calculations; update traceability and evidence. |
| 18 | Windows packaging, report, demo and submission | Package `Launch.exe`, clean-machine/offline/no-admin validation, source build instructions, AI disclosure, Git history, report <=6 pages, handwritten appendix, demo/walkthrough and final ZIP naming. |

## Sequencing notes
- Task 03 and Task 04 are complete: C++ core build and tests verified under MSVC 19.51.36260 / CMake 4.5.0-rc2; Electron 45.2.1 + React 18.3.1 + Three.js 0.170.0 desktop shell verified under Node.js 22.20.0 / npm 11.11.1. Git commits ebac724 and a59e721 preserved.
- Task 05 must choose the local HTTP transport and authentication design through a recorded ADR before exposing endpoints.
- Task 07 parsers are C++; Three.js receives validated geometry/data.
- Task 09 is visualization, not CAD editing.
- Task 18 packaging is a hard acceptance gate, not an afterthought.
- Keep the total at exactly 18 tasks. Do not split into extra numbered tasks; subtasks may be checklists within a task.
