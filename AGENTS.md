# Antigravity Project Rules — Unified Engineering Workbench

## Authority and scope
- `docs/ASSIGNMENT_REQUIREMENTS.md` is the assignment source of truth. Do not weaken, omit, or reinterpret mandatory requirements.
- `docs/ARCHITECTURE.md`, `docs/TOOLCHAIN_STRATEGY.md`, and `docs/PACKAGING_STRATEGY.md` define the approved implementation design.
- `docs/IMPLEMENTATION_PLAN.md` contains exactly 18 execution tasks. Execute one task at a time and wait for explicit user approval before starting the next.
- `docs/TRACEABILITY.md` maps assignment requirements and rubric criteria to implementation and evidence.

## Approved architecture
- Desktop shell: Electron.
- Frontend: React + TypeScript.
- 3D visualization: Three.js (React Three Fiber may be used as its React integration).
- 2D charts: Apache ECharts or Recharts; select one in a documented decision before implementation.
- Engineering backend: C++17 or later. All engineering calculations, FEM, file parsing, batch computation, concurrency, embedded mock logic, and backpropagation must be implemented in C++.
- Communication: local, loopback-only API between Electron/React and the C++ backend. The backend is a separate bundled executable launched and supervised by Electron.
- Build: CMake for C++; npm-based frontend build; electron-builder (or an equally justified packager) for Windows packaging.
- Electron renderer must not contain engineering algorithms or perform authoritative numerical calculations.

## Non-negotiable engineering boundaries
- Keep the C++ engineering core independent of Electron, React, HTTP transport, and UI libraries.
- Keep transport/API adapters separate from the core.
- Validate all API inputs in C++ even if the frontend also validates them.
- Use deterministic result ordering and explicit units in API schemas.
- Use bounded concurrency, cancellation-safe jobs, and no shared mutable solver state between independent cases.
- Do not claim synthetic CSV is an actual ANSYS export.
- Do not implement full CAD modelling, native ANSYS formats, mesh-to-result registration, physical board wiring, firmware deployment, or real FPGA programming unless the assignment is explicitly amended.
- No internet access or external service is required at runtime.

## Electron security requirements
- `nodeIntegration: false`, `contextIsolation: true`, and renderer sandboxing enabled where compatible.
- Expose only narrow, typed APIs through `contextBridge`; never expose raw `ipcRenderer`, Node APIs, filesystem APIs, or arbitrary command execution to React.
- Validate IPC sender and payloads.
- Bind the C++ backend to loopback only; use an ephemeral port or another documented local transport; do not listen on `0.0.0.0`.
- Use a per-launch random token or equivalent local authentication for renderer-to-backend requests.
- Restrict navigation and new-window creation; define a restrictive Content Security Policy.
- Do not load remote content in the privileged application renderer.
- Electron main process owns backend startup, readiness checks, graceful shutdown, and crash reporting.

## Task execution protocol
1. Read the task and all referenced requirements before editing.
2. State exact scope and files expected to change.
3. Do only the authorized task. No opportunistic refactors.
4. Preserve existing verified FEM source and tests unless the task explicitly authorizes a change.
5. Do not install packages, download dependencies, or modify machine configuration without explicit approval.
6. Do not fabricate command output, test results, performance numbers, hardware capabilities, or packaging success.
7. Run only tests relevant to the task and record exact commands, exit codes, and outcomes.
8. Update `docs/TRACEABILITY.md`, `docs/TEST_EVIDENCE.md`, and `docs/AI_USAGE_LOG.md` when appropriate.
9. Report changed files, evidence, limitations, and remaining risks. Stop and wait for approval.

## Existing files to preserve
- Preserve `src/core/thermal/FEMSolver.cpp`
- Preserve `src/core/thermal/FEMSolver.h`
- Preserve `src/core/thermal/ThermalModels.h`
- Preserve `tests/test_fem.cpp`
- Preserve their verified SHA256 values recorded in the Task 02 report unless the user explicitly authorizes a solver change.
- Existing Qt UI files are legacy and must not be compiled into the new application. Do not delete them without explicit approval and a documented migration step.
- Do not replace existing assignment requirements or environment evidence with assumptions.

## Definition of done
A task is complete only when its acceptance criteria are evidenced. Documentation-only work is not a build pass. A successful development run is not proof of clean-machine standalone packaging. The final Windows ZIP must be tested on a clean Windows 11 x64 environment with no development tools installed.
