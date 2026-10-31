# Windows standalone packaging strategy

## Delivery contract
The evaluator must be able to extract the submission ZIP and double-click `Launch.exe` on Windows 11 x64. The evaluator must not need Node.js, npm, Python, Qt, CMake, a compiler, an editor, administrator privileges, or internet access. Bundle lawful redistributables and all runtime assets.

## Proposed packaging
- Electron packages the desktop shell and Chromium runtime.
- React production assets are included locally.
- C++ backend executable is included as an unpacked executable/resource, not hidden inside an archive that prevents process execution.
- Include required MSVC runtime redistributables where licensing permits; validate on a clean Windows machine without development tools.
- Include example STL and synthetic CSV assets, provenance/licence notes, documentation, and any required local configuration.
- `Launch.exe` must be the actual entry point expected by the assignment, not a development script or a shortcut requiring Node/npm.
- electron-builder is the current candidate packager. Its Windows target and exact configuration must be pinned and tested.

## Startup lifecycle
1. `Launch.exe` starts Electron.
2. Electron main resolves the backend path from the packaged resource directory.
3. Main creates a per-launch authentication token and chooses an available loopback port or another documented local IPC transport.
4. Main starts the C++ backend with explicit arguments/environment; no shell command concatenation.
5. Backend binds only to loopback, authenticates local requests, and signals readiness.
6. Main loads the local React renderer only after backend readiness, with restrictive security settings.
7. On shutdown, main requests graceful backend stop, waits for exit, then terminates only as a bounded fallback.
8. On backend crash/startup failure, show actionable diagnostics and write a local log without corrupting result files.

## Security
- `nodeIntegration: false`.
- `contextIsolation: true`.
- Renderer sandbox enabled where compatible.
- Narrow `contextBridge` API; no raw Node or IPC objects.
- Restrictive Content Security Policy; no remote scripts or runtime CDN.
- Restrict navigation and new windows.
- Validate IPC sender and API request authentication.
- Loopback binding only; never `0.0.0.0`.
- Validate file paths and prevent path traversal.
- Do not execute user-supplied files or shell strings.

## One-click and source build
Provide:
- `Launch.exe` in the extracted top-level delivery folder.
- All required runtime files in a predictable adjacent folder.
- Separate CMake source-build instructions for C++ backend.
- Frontend/Electron source-build instructions.
- Antigravity/VS Code one-action run configuration that launches the same desktop app and starts the backend.
- A packaging manifest listing executables, DLLs, assets, licenses, and versions.

## Validation gates
- Build on Windows 11 x64.
- Test extraction and launch from a path containing spaces.
- Test on a clean Windows 11 x64 machine/VM with no Node.js, npm, CMake, compiler, Qt, or IDE.
- Test no-admin launch.
- Test offline startup.
- Test backend missing/corrupt, occupied port, backend crash, and graceful shutdown.
- Test file import, export, cancellation, and result persistence.
- Record exact OS, architecture, package hash, launch result, and logs.
- A successful developer-machine launch is not clean-machine packaging evidence.
