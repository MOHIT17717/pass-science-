# Assignment Requirements — Controlled Specification

Source: PASS Science Works, "Unified Engineering Workbench", Common Internship Assignment, 3 pages.

## General scope
- 15 calendar days stated by the assignment; target effort 40–50 hours.
- Web, desktop, or packaged executable acceptable.
- Frontend language unrestricted.
- All backend logic, numerical computation, file processing, and concurrency must be C++17+.
- AI assistants and open libraries permitted; disclose AI assistance, reused code, dependencies, and licences.
- Synthetic or openly licensed data only.

## A — Interface, backend, one-click execution
- One coherent interface with Geometry, Thermal Analysis, Performance, Hardware views; Task F backpropagation must also be accessible in the delivered application.
- File selection, parameter validation, progress/status, actionable errors, result export.
- Responsive during computation; cancellation or safe completion without corrupting results.
- Separate C++ core from presentation and transport.
- Windows 11 x64.
- Extract ZIP and double-click Launch.exe: no terminal, PowerShell, admin rights, package installation, first-run build.
- Bundle redistributable runtime dependencies lawfully.
- Include VS Code or Antigravity run configuration that starts same packaged app in one action after documented configuration is selected.
- Standalone launcher must not require editor or internet.
- Separate CMake source-build instructions.

## B — CAD / ANSYS data visualization
- Import ASCII STL and CSV with exact columns: `node_id,x_m,y_m,z_m,temperature_C`.
- Supply one small openly licensed or self-created example of each; document provenance, units, export/schema notes.
- Self-created CSV must be labelled synthetic, not actual ANSYS output.
- Display STL triangles with rotate, pan, zoom, fit-to-view.
- Display CSV nodes as coloured 3D point cloud with temperature legend, units, node inspection.
- Mesh/result registration not required.
- Parse and validate both formats in C++.
- Reject malformed/non-finite data; explain empty files; document tested file-size limits.
- Native ANSYS project/result formats and native CAD solids out of scope.

## C — Thermal FEA
- Steady-state 1D thermal FEM for uniform rod, two-node linear elements.
- Parameters: L=1 m, A=1e-4 m², k=10 W/(m K), q=10000 W/m³, T(0)=100°C, T(L)=20°C.
- Constant properties; insulated lateral surfaces.
- Equation: `-d/dx(kA dT/dx) = qA`.
- Assemble element stiffness and load contributions; impose both prescribed temperatures correctly.
- Meshes: N=10,20,40,80 uniform elements.
- Plot temperature vs x; compare to `T_exact(x)=100 - 80x/L + [q/(2k)]x(L-x)`.
- Report maximum absolute error at element midpoints using FE interpolation, not only nodes.
- Show mesh convergence; label units; export underlying CSV.
- Explain assumptions, units, boundary conditions, and one debugging insight.

## D — Multicore / multithreaded execution
- Serial and CPU-parallel batch of independent thermal solves in C++.
- Bounded worker pool, standard threads, or OpenMP; not merely background UI work.
- Fixed-seed reproducible generator; varied positive k and q; configurable case count and mesh.
- Same cases and numerical methods in both paths; independent solves; deterministic input result order.
- Measure compute wall time for 1,2, and up to 4 workers, capped at logical CPU count.
- Report CPU, physical/logical cores, RAM, compiler, optimization flags, workload, warm-up, five measured repetitions, median, speedup `T1/Tp`, efficiency `(T1/Tp)/p`.
- Exclude file loading, rendering, compilation from compute timings; report launch-to-ready separately.
- Verify serial/parallel max absolute temperature difference <= 1e-8 °C.
- Explain overhead and limitations.
- If one logical CPU, demonstrate parallel path and disclose speedup cannot be assessed.

## E — Embedded-system integration design
- Design modular host-connected workbench for one microcontroller board, one FPGA board, one JTAG debug adapter.
- Labelled block diagram and concise interface/pin-voltage table covering power, ground, voltage domains, level shifting, connectors, host communication, JTAG signal ownership, device-specific pinout assumptions.
- Explain JTAG adapter is debug interface, not generic interchangeable compute board; do not assume shared connector, voltage, or protocol.
- C++ mock adapters: discovery, capability reporting, connect/disconnect, one telemetry message.
- Demonstrate all three device types in UI and one recoverable failure (e.g. timeout).
- Clearly label simulated behaviour.
- Safe integration plan and limitations.
- Physical wiring, PCB, firmware deployment, real FPGA programming not required.

## F — Simple handwritten backpropagation
- One regression sample: x=1, y=2.
- `h=tanh(wx+b)`, `y_hat=vh+c`, `J=0.5(y_hat-y)^2`.
- Initial w=0.5, b=0, v=1, c=0, learning rate 0.1.
- Handwrite forward pass, chain-rule derivatives for all four parameters, one simultaneous update using original gradients, numerical values, gradient-direction explanation.
- Legible scan/photo, maximum two pages.
- Implement same calculation in C++ without automatic differentiation.
- Check each initial gradient by central finite differences, epsilon=1e-6, absolute error <=1e-5.
- Plot loss over 100 subsequent training steps with same learning rate; explain result.

## Submission
- ZIP name `CandidateID_Workbench.zip`.
- Include Launch.exe and packaged app; src frontend and C++ backend; CMakeLists and dependency lock/version info; editor run config; data provenance; tests; results raw CSV and labelled plots; docs; README; version-control evidence.
- Relative paths; no credentials, personal data, machine-specific absolute paths.
- README prerequisites, one-click steps, architecture, formats, tests/build, limitations.
- Report <=6 pages excluding two-page handwritten appendix.
- 3–5 minute demo video OR timestamped screenshot walkthrough with logs.
- Git bundle or local repository with meaningful history and readable commit log.
- AI-use log with model/tool names where available, representative prompts/outputs, edits, validation, one actual unsuitable suggestion or deliberate challenge test; do not fabricate.
- Ownership statement: reused and original work.

## Published rubric (100)
- Interface/webpage design 8
- C++ backend and testing 12
- Folder architecture 6
- Code readability 6
- Version control 5
- Thermal FEA and adoption 14
- CAD/ANSYS visualization 10
- Multicore performance 10
- Embedded integration 8
- Backpropagation 7
- Prompt engineering / AI judgement 8
- One-click delivery / report 6

## Shortlisting gates
- 80–100 strong interview shortlist; 50–80 interview shortlist; below 50 not shortlisted.
- Both shortlist bands also require at least 6/12 C++ backend, 7/14 thermal FEA, 3/6 delivery/report, working C++ backend, and successful standalone launch.
- Packaging-only failure: one clarification/repackaging opportunity within 48 hours, no new feature work.
- Every candidate receives criterion-level scores, total, gate outcomes, two strengths, two improvement priorities, and shortlist reason.
