# Assignment requirement traceability

The assignment PDF remains authoritative. This matrix is a project implementation mapping, not a replacement for the PDF. Preserve exact source wording and rubric weights in `ASSIGNMENT_REQUIREMENTS.md`.

| Assignment requirement | Planned implementation | Task(s) | Evidence |
|---|---|---:|---|
| A: coherent desktop UI, validation, progress, errors | Electron + React UI and typed C++ API | 05, 08, 11, 17 | UI walkthrough, API tests, logs |
| A: C++ backend separated from presentation | C++ core independent of transport/UI | 03, 05, 17 | CMake target graph, code review, tests |
| A: Windows x64 standalone `Launch.exe` | Electron packaged shell + bundled C++ backend | 18 | Clean-machine launch logs/video |
| A: separate CMake source build and one-action IDE run | CMake docs and Antigravity/VS Code config | 03, 18 | Build instructions and run config |
| B: ASCII STL import and rendering | C++ parser; Three.js renderer | 07, 09 | Sample STL, parser tests, UI evidence |
| B: exact temperature CSV schema | C++ parser and validated DTO | 07, 09 | Synthetic CSV, schema tests |
| B: rotate/pan/zoom/fit | Three.js controls | 09 | Interaction walkthrough |
| B: coloured point cloud, legend, node inspection | Three.js point rendering + React UI | 09 | Screenshot/demo and test fixture |
| B: provenance, units, limits, malformed input | Data manifest and C++ validation | 07, 09 | Docs and parser tests |
| C: 1D two-node linear thermal FEM | Existing C++ solver, verified against assignment | 06 | Unit tests and equations |
| C: N=10/20/40/80 and analytical comparison | C++ solver + result series | 06, 10 | CSV, plots, error report |
| C: midpoint interpolation max error | C++ calculation at element midpoints | 06 | Automated numerical assertion |
| C: assumptions, units, BCs, debugging insight | Report and UI metadata | 06, 18 | Technical report |
| D: serial and parallel batch solves | C++ deterministic generator and worker pool | 12, 13 | Tests and source |
| D: 1/2/up to 4 workers and reproducibility | Bounded C++ pool and ordered results | 13 | Comparison tests |
| D: five repetitions, median, speedup, efficiency | C++ benchmark harness | 14 | CSV and plots |
| D: hardware/compiler/workload disclosure | Benchmark metadata | 14, 18 | Benchmark report |
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
