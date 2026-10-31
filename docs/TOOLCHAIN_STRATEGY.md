# Toolchain and dependency strategy

## Required development tools
- Windows 11 x64.
- MSVC x64 C++17 toolchain (Visual Studio 2022 Build Tools is the recommended route).
- CMake 3.20+ (use a current stable release compatible with selected dependencies).
- Git.
- Node.js LTS and npm for frontend/Electron development.
- Antigravity for agent-assisted development.

The user's audit dated 2026-10-31 found Git installed but did not find a C++ compiler, CMake, or Qt. Qt is no longer part of the approved architecture. Node.js/npm status has not yet been audited and must not be assumed.

## Frontend
- React + TypeScript.
- Vite for frontend development/build.
- Electron for desktop shell.
- Three.js; React Three Fiber is an optional integration layer, not a requirement to use both.
- Select exactly one chart library (Apache ECharts or Recharts) before implementation and record rationale.
- Use npm with a committed lockfile and pinned compatible versions.
- Avoid unnecessary UI libraries and runtime CDN dependencies.

## C++ backend
- C++17 or later.
- CMake.
- MSVC x64.
- `nlohmann/json` is a candidate JSON library.
- Select a small, maintained HTTP server library only after comparing licensing, Windows support, maintenance, and packaging. Do not invent a library choice in code before ADR approval.
- GoogleTest is a candidate unit-test framework; CTest orchestrates tests.
- Keep dependencies pinned and licenses recorded.

## Dependency acquisition
No dependency installation or download is authorized by this document alone.
Before adding dependencies:
1. Record exact name, version/tag/commit, source URL, license, purpose, and transitive dependencies.
2. Choose FetchContent or vendored source and explain reproducibility/offline-build implications.
3. Confirm the chosen method works on Windows/MSVC.
4. Preserve lockfiles and CMake dependency pins.
5. Do not depend on internet access at runtime.

## Build separation
- CMake builds the C++ core, API adapter, backend executable, and C++ tests.
- npm builds the React renderer and Electron main/preload bundles.
- Electron packaging copies the frontend output and backend executable/resources into the distributable.
- The source-build documentation must explain prerequisites and build order.
- Provide one-action Antigravity/VS Code development launch that starts the same application components as the packaged app.

## CMake strategy
- Root CMake project defines C++ standards, warnings, core library, API adapter, backend executable, and tests.
- `uew_core` must not link Electron, Node, React, HTTP, OpenGL, or frontend libraries.
- `uew_api` links `uew_core` plus the selected transport/JSON dependencies.
- `uew_backend` links `uew_api` and `uew_core`.
- Tests link `uew_core` and test-only dependencies, never Electron.
- Keep existing thermal solver files and tests intact initially; any move or signature change requires an approved migration task and hash/evidence update.
- CMake install/staging rules place the backend executable and required runtime DLLs in a predictable packaging staging directory.

## Development commands (illustrative; finalize after implementation)
- Configure: `cmake -S . -B build -A x64`
- Build: `cmake --build build --config Release`
- Test: `ctest --test-dir build -C Release --output-on-failure`
- Frontend install/build: `npm ci` and `npm run build` from the approved workspace root.
- These commands are proposed only; do not report them as executed until actually run.
