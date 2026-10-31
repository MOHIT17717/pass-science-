# Architecture — Electron + React + C++17

## 1. Decision summary
The application is a Windows 11 x64 desktop engineering workbench. Electron provides the desktop runtime and window; React + TypeScript provides the UI; Three.js provides 3D visualization; C++17 or later owns all engineering computation and file-processing logic.

This architecture satisfies the assignment's technology boundary: C++17+ is mandatory for backend logic, numerical computation, file processing, and concurrency, while the frontend technology is selectable. The application remains a desktop application, not a hosted website.

## 2. Logical architecture

```text
Windows 11 x64 — Launch.exe
└── Electron Main Process
    ├── Creates and secures BrowserWindow
    ├── Starts/stops bundled C++ backend executable
    ├── Waits for backend readiness
    ├── Owns lifecycle, logs, crash handling
    └── Narrow IPC bridge via preload
        └── React + TypeScript Renderer
            ├── Workbench navigation and forms
            ├── Three.js / React Three Fiber: STL mesh and CSV point cloud
            ├── 2D chart library: FEM, convergence, benchmark, loss
            └── Typed frontend API client
                 │ loopback HTTP + per-launch token
                 ▼
             C++ API/Transport Adapter
                 │ typed requests
                 ▼
             C++17 Engineering Core
             ├── Thermal FEM
             ├── STL/CSV parsing and validation
             ├── Batch/parallel execution
             ├── Embedded mock adapters
             ├── Manual backpropagation
             └── CSV/result export
```

## 3. Process responsibilities

### Electron main process
- Owns the desktop window and application lifecycle.
- Resolves the packaged backend executable path without relying on the current working directory.
- Starts the C++ backend as a child process, captures stdout/stderr, waits for a readiness signal, and terminates it gracefully on application exit.
- Handles unexpected backend exit and presents an actionable error.
- Does not perform FEM, parsing, or benchmark calculations.

### Preload
- Uses `contextBridge` to expose a small, typed, allow-listed API.
- Does not expose raw Node.js, filesystem, process, shell, or IPC primitives.
- Validates message shape and restricts operations.

### React renderer
- Owns presentation, navigation, user input, client-side form feedback, and visualization.
- Uses Three.js for STL triangles and temperature point-cloud rendering.
- Uses a single selected 2D chart library for plots.
- May perform presentation-only transformations (e.g., camera framing or color mapping) but not authoritative engineering calculations.
- Does not parse engineering source files as the authoritative parser; C++ parses and returns validated geometry/data.

### C++ API/transport adapter
- Exposes a documented versioned local API.
- Validates payloads, sizes, ranges, units, and request IDs.
- Maps transport DTOs to core types and maps core results to response DTOs.
- Is separate from the engineering core.
- Binds only to loopback (`127.0.0.1` or `::1`), never all interfaces.
- Uses a random per-launch token or equivalent local authentication and rejects unauthenticated requests.
- Does not trust frontend validation.

### C++ engineering core
- Remains independent of Electron, React, HTTP, and charting libraries.
- Contains all numerical methods, file parsing, concurrency, mock-device logic, and export logic.
- Is testable without launching Electron or creating a window.

## 4. Proposed repository structure

```text
/
├── AGENTS.md
├── CMakeLists.txt                 # C++ workspace entry
├── package.json                  # workspace scripts, if using npm workspaces
├── package-lock.json
├── electron/
│   ├── main/
│   ├── preload/
│   └── packaging/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   │   ├── geometry/
│   │   │   ├── thermal/
│   │   │   ├── performance/
│   │   │   ├── hardware/
│   │   │   └── backpropagation/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   ├── public/
│   └── package.json
├── backend/
│   ├── api/
│   ├── core/
│   │   ├── thermal/
│   │   ├── geometry/
│   │   ├── data/
│   │   ├── parallel/
│   │   ├── embedded/
│   │   ├── backprop/
│   │   └── export/
│   └── app/
├── third_party/                  # pinned dependency source or documented fetch cache
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── assets/
│   ├── examples/
│   └── diagrams/
├── docs/
└── packaging/
    ├── windows/
    └── scripts/
```

This is a target structure, not permission to move existing files during the documentation task. Preserve the current thermal paths until a separately approved migration task specifies exact moves and updates all build/test references.

## 5. API design principles
- Version API paths, e.g. `/api/v1/...`.
- Use JSON DTOs with explicit units and stable field names.
- Large geometry and point-cloud payloads may use a documented binary or file-handle transfer if JSON size becomes unsuitable; decide and benchmark before implementation.
- Long-running operations return job IDs and support status, progress, cancellation, and result retrieval.
- Cancellation must leave prior completed results intact.
- Every response includes request/job identity and structured error information.
- Define maximum input sizes and tested limits.

Suggested route groups:
- `/api/v1/health`
- `/api/v1/geometry/stl/inspect`
- `/api/v1/data/temperature-csv/inspect`
- `/api/v1/thermal/solve`
- `/api/v1/jobs/{id}`
- `/api/v1/jobs/{id}/cancel`
- `/api/v1/performance/benchmark`
- `/api/v1/embedded/devices`
- `/api/v1/backpropagation/train`
- `/api/v1/results/{id}/export`

Exact routes and transport library must be selected in a recorded decision before implementation.

## 6. Visualization contract
- STL: C++ validates ASCII STL and returns triangle vertices/normals or a documented geometry representation; Three.js renders the geometry and provides rotate, pan, zoom, fit-to-view.
- Temperature CSV: C++ validates exact columns `node_id,x_m,y_m,z_m,temperature_C`, returns points and units; React/Three.js renders colored points, legend, and node inspection.
- 2D: selected chart library renders C++-produced series for temperature-vs-position, convergence, benchmark timings/speedup, and 100-step loss history.
- UI labels and exports must retain units and synthetic-data provenance.

## 7. Threading and responsiveness
- C++ computation runs outside the Electron UI thread.
- The backend uses bounded worker pools for independent cases.
- API operations must not block the event loop or Electron main process.
- Progress polling or server-sent events may be selected after considering complexity; do not add WebSockets without need.
- Cancellation is cooperative and tested.

## 8. Architecture exclusions
No full CAD solid modeller, native ANSYS format support, mesh-to-result registration, physical board wiring, firmware deployment, or real FPGA programming. The embedded task is a labelled safe design plus C++ mock adapters.
