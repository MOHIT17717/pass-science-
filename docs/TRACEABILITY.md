# Assignment requirement traceability

The assignment PDF remains authoritative. This matrix is a project implementation mapping, not a replacement for the PDF. Preserve exact source wording and rubric weights in `ASSIGNMENT_REQUIREMENTS.md`.

| Assignment requirement | Planned implementation | Task(s) | Evidence |
|---|---|---:|---|
| A: coherent desktop UI, validation, progress, errors | Electron + React UI and typed C++ API | 04, 05, 08, 11, 17 | UI walkthrough, API tests, logs |
| A: C++ backend separated from presentation | C++ core independent of transport/UI | 03, 04, 05, 17 | CMake target graph, code review, tests |
| A: Windows x64 standalone `Launch.exe` | Electron packaged shell + bundled C++ backend | 18 | Clean-machine launch logs/video |
| A: separate CMake source build and one-action IDE run | CMake docs and Antigravity/VS Code config | 03, 18 | Build instructions and run config |
| B: ASCII STL import and rendering | C++ parser; Three.js renderer | 04, 07, 08 | `data/cad/sample_bracket.stl`, `uew_parser_tests`, `test_api` parse-stl, `ThreeViewport.tsx` BufferGeometry |
| B: exact temperature CSV schema | C++ parser and validated DTO | 07, 08 | `data/ansys/synthetic_temperature_point_cloud.csv`, `uew_parser_tests`, `test_api` parse-csv, `TemperatureWorkspace.tsx` |
| B: rotate/pan/zoom/fit | Three.js controls | 08 | `ThreeViewport.tsx` OrbitControls, `fitCameraToObject`, `ViewportControls.tsx` presets |
| B: coloured point cloud, legend, node inspection | Three.js point rendering + React UI | 08 | `ThreeViewport.tsx` spectral colormap, `TemperatureLegend.tsx` vertical bar in °C, raycast node picker |
| B: provenance, units, limits, malformed input | Data manifest and C++ validation | 07, 08 | `data/DATA_PROVENANCE.md`, synthetic provenance badge, 10 MB caps, binary rejection, duplicate node_id rejection |
| C: 1D two-node linear thermal FEM | Existing C++ solver, verified against assignment | 06, 09 | Unit tests, C++ core solver, and `ThermalWorkspace.tsx` integration |
| C: N=10/20/40/80 and analytical comparison | C++ solver + result series | 06, 09 | `ThermalWorkspace.tsx`, `ThermalChart.tsx` 2D plot (continuous analytical vs. FEM segments), CSV exports |
| C: midpoint interpolation max error | C++ calculation at element midpoints | 06, 09 | Automated numerical assertion, convergence table ($0.01953125^\circ\text{C}$ for N=80), error profile plot |
| C: assumptions, units, BCs, debugging insight | Report and UI metadata | 06, 09, 18 | Physical parameter card (A=0.0001 m², L=1.0 m, k=10, q=10000), Dirichlet BCs (100 °C, 20 °C), technical report |
| D: serial and parallel batch solves | C++ deterministic generator and genuine serial baseline vs worker pool | 10 | `src/core/benchmark/ParallelExecutor.cpp`, `uew_benchmark_tests`, `PerformanceWorkspace.tsx` |
| D: 1/2/up to 4 workers and reproducibility | Bounded C++ pool, deterministic ordering, and <=1e-8 °C agreement | 10 | `uew_benchmark_tests`, `test_api` benchmark routes, numerical verification table |
| D: five repetitions, median, speedup, efficiency | C++ benchmark harness and SVG speedup/efficiency chart | 10 | `src/core/benchmark/BenchmarkHarness.cpp`, `BenchmarkChart.tsx`, CSV export |
| D: hardware/compiler/workload disclosure | Dynamic Win32 runtime hardware & build query | 10, 18 | `src/core/benchmark/EnvironmentHelper.cpp`, hardware disclosure card, technical report |
| E: MCU, FPGA, JTAG design and electrical safety | Diagram/table and C++ simulated adapters | 15 | Diagram, interface table, mock tests |
| E: recoverable timeout and simulated labels | Mock adapter error handling and React status | 15, 17 | Failure test and UI evidence |
| F: manual backpropagation | C++ implementation, no autodiff | 16 | Hand calculation and unit tests |
| F: finite-difference check <=1e-5 | C++ gradient verification | 16 | Automated test output |
| F: 100-step loss plot | C++ history, React chart | 16 | CSV and chart |
| Rubric: interface/design | React/Electron UX | 08–10, 17 | Walkthrough |
| Rubric: C++ backend/testing | C++ core, API and tests | 03, 05–07, 11–17 | CTest and code review |
| Rubric: architecture/readability/version control | Modular repo, documentation, Git history | 02–05, 17–18 | Repository and commit history |
| Rubric: one-click delivery/report/AI judgement | Packaging, evidence and disclosure | 18 | ZIP, report, AI log, clean-machine evidence |

## Architecture invariants
1. React/TypeScript and Three.js are presentation only.
2. C++17+ owns engineering calculations, authoritative parsing, file processing, parallel execution, embedded mocks and backpropagation.
3. No internet or development tools are required at runtime.
4. The final package is a Windows 11 x64 desktop application with `Launch.exe`.
5. Preserve all assignment-specific numerical values, equations, input schema, thresholds, rubric weights, and shortlist gates.
