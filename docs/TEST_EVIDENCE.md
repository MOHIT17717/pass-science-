# Test Evidence Log

Append one entry per verification run.

| Date/time | Task | Environment | Command | Exit code | Result | Log/artifact |
|---|---|---|---|---:|---|---|
| 2026-10-31 23:14 IST | Task 01 | Win11 x64 / i7-1255U | `cmd /c ver` | 0 | Windows [Version 10.0.26300.9818] | `docs/ENVIRONMENT.md` |
| 2026-10-31 23:14 IST | Task 01 | Win11 x64 / i7-1255U | `$env:PROCESSOR_ARCHITECTURE` | 0 | AMD64 | `docs/ENVIRONMENT.md` |
| 2026-10-31 23:14 IST | Task 01 | Win11 x64 / i7-1255U | `HKLM CentralProcessor 0 & Win32 API` | 0 | 12th Gen Intel Core i7-1255U, 10 physical cores, 12 logical cores | `docs/ENVIRONMENT.md` |
| 2026-10-31 23:15 IST | Task 01 | Win11 x64 / i7-1255U | `GlobalMemoryStatusEx` | 0 | 16,874,135,552 bytes (~16 GB) total physical RAM | `docs/ENVIRONMENT.md` |
| 2026-10-31 23:19 IST | Task 01 | Win11 x64 / Iris Xe | `WGL glGetString` | 0 | Intel Iris Xe Graphics, OpenGL 4.6.0 Build 32.0.101.6733 | `docs/ENVIRONMENT.md` |
| 2026-10-31 23:13 IST | Task 01 | Win11 x64 / i7-1255U | `git --version` | 0 | git version 2.46.2.windows.1 | `docs/ENVIRONMENT.md` |
| 2026-10-31 23:13 IST | Task 01 | Win11 x64 / i7-1255U | `git status` | 1 | fatal: not a git repository | `docs/ENVIRONMENT.md` |
| 2026-10-31 23:15 IST | Task 01 | Win11 x64 / i7-1255U | `cmake --version` | 1 | cmake not found in PATH (BLOCKED) | `docs/ENVIRONMENT.md` |
| 2026-10-31 23:18 IST | Task 01 | Win11 x64 / i7-1255U | `where.exe cl gcc clang` | 1 | No C++ compilers found in PATH (BLOCKED) | `docs/ENVIRONMENT.md` |
| 2026-10-31 23:18 IST | Task 01 | Win11 x64 / i7-1255U | `where.exe qmake; Test-Path C:\Qt` | 1 | Qt 6 not found on system (BLOCKED) | `docs/ENVIRONMENT.md` |
| 2026-10-31 23:41 IST | Task 02 | Win11 x64 / i7-1255U | `Get-FileHash SHA256 (thermal files & test)` | 0 | All 4 files unmodified, hashes verified identical | `docs/ARCHITECTURE.md` |
| 2026-11-01 00:03 IST | Task 02 (Rev) | Win11 x64 / i7-1255U | `node --version; npm --version` | 0 | Node v22.20.0, npm 11.11.1 verified | `docs/ENVIRONMENT.md` |
| 2026-11-01 00:04 IST | Task 02 (Rev) | Win11 x64 / i7-1255U | `Get-FileHash SHA256 (thermal files & test)` | 0 | Documentation-only migration to Electron+React+C++17; thermal backend and tests preserved byte-for-byte; no build/test claimed | `docs/ARCHITECTURE.md` |
| 2026-11-01 00:11 IST | Task 03 | Win11 x64 / i7-1255U | `where.exe cl; where.exe cmake; where.exe git; where.exe node; where.exe npm` | 0 | Git (2.46.2), Node (22.20.0), npm (11.11.1) found; cl and cmake NOT found (BLOCKED) | `docs/ENVIRONMENT.md` |
| 2026-11-01 00:12 IST | Task 03 | Win11 x64 / i7-1255U | `Get-FileHash SHA256 (thermal files & test)` | 0 | FEM sources and tests verified identical to baseline | `CMakeLists.txt` |
| 2026-11-01 00:13 IST | Task 03 | Win11 x64 / i7-1255U | `git init; git add .; git commit` | 0 | Initialized Git repository; clean baseline commit `ebac724` created | Git log `ebac724` |
| 2026-11-01 00:13 IST | Task 03 | Win11 x64 / i7-1255U | `cmake -S . -B build` | 1 | CommandNotFoundException: cmake not installed/not in PATH (BLOCKED) | Build terminal |
| 2026-11-01 00:41 IST | Task 03 | Win11 x64 / i7-1255U | `vcvars64.bat && cl.exe` | 0 | Visual Studio 2026 v18.11.3, MSVC 19.51.36260 x64 verified | Environment audit |
| 2026-11-01 00:41 IST | Task 03 | Win11 x64 / i7-1255U | `cmake.exe --version` | 0 | CMake 4.5.0-rc2 verified | Environment audit |
| 2026-11-01 00:43 IST | Task 03 | Win11 x64 / i7-1255U | `cmake -S . -B build -G "Visual Studio 18 2026" -A x64` | 0 | Configured project with MSVC 19.51.36260, SDK 10.0.26100.0, 0 errors, 0 warnings | `build/` |
| 2026-11-01 00:43 IST | Task 03 | Win11 x64 / i7-1255U | `cmake --build build --config Release` | 0 | Built `uew_core.lib` and `uew_core_tests.exe` cleanly; 0 errors, 0 warnings | `build/Release/` |
| 2026-11-01 00:43 IST | Task 03 | Win11 x64 / i7-1255U | `ctest --test-dir build -C Release --output-on-failure --verbose` | 0 | 1/1 tests passed: `uew_core_tests` passed (80-element max midpoint error: 0.0195312 C) | CTest log |
| 2026-11-01 00:43 IST | Task 03 | Win11 x64 / i7-1255U | `build\Release\uew_core_tests.exe` | 0 | PASS: FEM boundary conditions, convergence and validation (0.0195312 C error) | Standalone test |
| 2026-11-01 00:48 IST | Task 03 | Win11 x64 / i7-1255U | `git commit` | 0 | Created Task 03 completion commit `a59e721` | Git log `a59e721` |
| 2026-11-01 01:05 IST | Task 04 | Win11 x64 / i7-1255U | `npm install` | 0 | Installed 146 dependencies in 26s, generated lockfile | `package-lock.json` |
| 2026-11-01 01:06 IST | Task 04 | Win11 x64 / i7-1255U | `node node_modules/electron/install.js` | 0 | Downloaded prebuilt Electron 45.2.1 x64 binary | `node_modules/electron/dist/electron.exe` |
| 2026-11-01 01:18 IST | Task 04 | Win11 x64 / i7-1255U | `npm run build:electron` | 0 | Compiled main and preload TypeScript (`tsc -p electron/tsconfig.json`), 0 errors | `dist/electron/` |
| 2026-11-01 01:18 IST | Task 04 | Win11 x64 / i7-1255U | `npm run build:renderer` | 0 | Built React production bundle (`vite build --config frontend/vite.config.ts`) in 2.04s, 0 errors | `dist/renderer/` |
| 2026-11-01 01:18 IST | Task 04 | Win11 x64 / i7-1255U | `npm run typecheck` | 0 | Typecheck passed for both renderer and electron, 0 errors | TypeScript output |
| 2026-11-01 01:20 IST | Task 04 | Win11 x64 / i7-1255U | `node scripts/run-electron.js . --test-autoclose=3000` | 0 | Window opened, WebGL initialized, React shell mounted, preload API verified, window auto-closed cleanly | Console log output |
| 2026-11-01 01:20 IST | Task 04 | Win11 x64 / i7-1255U | `Get-FileHash SHA256 (thermal files & test)` | 0 | All 4 FEM files verified byte-for-byte identical to baseline | File hashes |
| 2026-11-01 01:28 IST | Task 04 | Win11 x64 / i7-1255U | `npm run build` | 0 | Built React bundle (Vite) and Electron (tsc) in 2.14s, 0 errors | `dist/` |
| 2026-11-01 01:28 IST | Task 04 | Win11 x64 / i7-1255U | `npm run typecheck` | 0 | Typecheck passed for both renderer and electron, 0 errors | TypeScript output |
| 2026-11-01 01:29 IST | Task 04 | Win11 x64 / i7-1255U | `ctest.exe --test-dir build -C Release --output-on-failure --verbose` | 0 | 1/1 CTest passed (100% pass): `uew_core_tests` (0.0195312 C error) | CTest output |
| 2026-11-01 01:29 IST | Task 04 | Win11 x64 / i7-1255U | `build\Release\uew_core_tests.exe` | 0 | PASS: FEM boundary conditions, convergence and validation (0.0195312 C error) | Standalone test |
| 2026-11-01 01:31 IST | Task 04 | Win11 x64 / i7-1255U | `git commit` | 0 | Created Task 04 completion commit `f06493e` | Git log `f06493e` |
| 2026-11-01 01:44 IST | Task 05 | Win11 x64 / i7-1255U | `cmake --build build --config Release` | 0 | Built `uew_core.lib`, `uew_api.lib`, `uew_backend.exe`, `uew_core_tests.exe`, `uew_api_tests.exe` cleanly (0 errors/0 warnings) | MSBuild output |
| 2026-11-01 02:02 IST | Task 05 | Win11 x64 / i7-1255U | `ctest --test-dir build -C Release --output-on-failure --verbose` | 0 | 2/2 tests passed (100%): `uew_core_tests` (0.0195312 C error) and `uew_api_tests` (16 test cases: dynamic port, pre-handshake 503, 401 token check, 200 health with explicit units, 400 bad request line/header, 505 HTTP ver, 405 method, 431 header limit, 413 body limit, 404 route, 5 concurrent requests, graceful stop, repeated start/stop) | CTest output |
| 2026-11-01 02:03 IST | Task 05 | Win11 x64 / i7-1255U | `npm run build:electron && npm run typecheck` | 0 | Compiled Electron main and verified TypeScript types, 0 errors | TypeScript output |
| 2026-11-01 02:03 IST | Task 05 | Win11 x64 / i7-1255U | `node scripts/run-electron.js . --test-autoclose=3000` | 0 | Full end-to-end launch: dynamic port (62015), secure stdin token handshake (`INIT_TOKEN`), 200 OK health check, React/Three.js mount, and graceful `SHUTDOWN\n` stdin exit | Console output |
| 2026-11-01 02:03 IST | Task 05 | Win11 x64 / i7-1255U | `Get-FileHash SHA256 (thermal files & test)` | 0 | All 4 FEM files verified byte-for-byte identical to baseline | File hashes |
| 2026-11-01 02:12 IST | Task 05 (Acceptance) | Win11 x64 / i7-1255U | `cmake --build build --config Release` | 0 | Compiled `uew_core`, `uew_api`, `uew_backend.exe`, `uew_core_tests.exe`, `uew_api_tests.exe` in Release mode (0 errors/0 warnings) | MSBuild log |
| 2026-11-01 02:12 IST | Task 05 (Acceptance) | Win11 x64 / i7-1255U | `ctest --test-dir build -C Release --output-on-failure --verbose` | 0 | 2/2 tests passed (100%): `uew_core_tests` (0.0195312 C error) and `uew_api_tests` (22 test cases including 7 token comparisons, 501 chunked rejection, 411 length required, incomplete request handling, premature disconnect, in-flight graceful shutdown drain, and child process stdin EOF clean exit with code 0) | CTest log |
| 2026-11-01 02:12 IST | Task 05 (Acceptance) | Win11 x64 / i7-1255U | `npm run typecheck` | 0 | Typecheck passed for renderer and electron main/preload, 0 errors | TypeScript output |
| 2026-11-01 02:13 IST | Task 05 (Acceptance) | Win11 x64 / i7-1255U | `npm run build` | 0 | Vite renderer bundle built in 1.84s and Electron compiled via tsc, 0 errors | `dist/` |
| 2026-11-01 02:13 IST | Task 05 (Acceptance) | Win11 x64 / i7-1255U | `node scripts/run-electron.js . --test-autoclose=3000` | 0 | Full end-to-end integration: dynamic port 65447, token handshake (`INIT_TOKEN` -> `[TOKEN READY]`), 200 OK health check, React + Three.js WebGL viewport initialized, auto-closed with graceful `SHUTDOWN\n` and exit code 0 | Console log |
| 2026-11-01 02:13 IST | Task 05 (Acceptance) | Win11 x64 / i7-1255U | `Get-FileHash SHA256 (thermal files & test)` | 0 | All 4 FEM files verified byte-for-byte identical to baseline | File hashes |
| 2026-11-01 02:15 IST | Task 05 (Acceptance) | Win11 x64 / i7-1255U | Code Inspection & Lifecycle Audit | N/A | Electron backend startup-failure cleanup (`this.stop()` on timeout/health check rejection in `backend-manager.ts`) is implemented, but not independently verified via automated failure injection. | `electron/main/backend-manager.ts` |
| 2026-11-01 02:26 IST | Task 06 | Win11 x64 / i7-1255U | `cmake --build build --config Release` | 0 | Compiled `uew_core`, `uew_api`, `uew_backend.exe`, `uew_core_tests.exe`, `uew_thermal_tests.exe`, `uew_api_tests.exe` cleanly (0 errors/0 warnings) | MSBuild log |
| 2026-11-01 02:26 IST | Task 06 | Win11 x64 / i7-1255U | `ctest --test-dir build -C Release --output-on-failure --verbose` | 0 | 3/3 tests passed (100%): `uew_core_tests` (0.0195312 C error), `uew_thermal_tests` (N=10, 20, 40, 80 meshes, exact midpoint errors 1.25, 0.3125, 0.078125, 0.01953125 C, second-order O(h^2) convergence rate 2.0, CSV export, input rejection), and `uew_api_tests` (thermal solve API, invalid mesh rejection 400, CSV export API 200) | CTest log |
| 2026-11-01 02:26 IST | Task 06 | Win11 x64 / i7-1255U | `npm run typecheck` | 0 | Typecheck passed for renderer and electron main/preload, 0 errors | TypeScript output |
| 2026-11-01 02:26 IST | Task 06 | Win11 x64 / i7-1255U | `npm run build` | 0 | Vite renderer bundle built in 1.87s and Electron compiled via tsc, 0 errors | `dist/` |
| 2026-11-01 02:27 IST | Task 06 | Win11 x64 / i7-1255U | `node scripts/run-electron.js . --test-autoclose=3000` | 0 | Full end-to-end integration: dynamic port 56384, token handshake (`INIT_TOKEN` -> `[TOKEN READY]`), 200 OK health check, React + Three.js WebGL viewport initialized, auto-closed with graceful `SHUTDOWN\n` and exit code 0 | Console log |
| 2026-11-01 02:27 IST | Task 06 | Win11 x64 / i7-1255U | `Get-FileHash SHA256 (thermal files & test)` | 0 | All 4 FEM files verified byte-for-byte identical to baseline | File hashes |
| 2026-11-01 02:35 IST | Task 06 (Acceptance) | Win11 x64 / i7-1255U | `cmake --build build --config Release` | 0 | Compiled `uew_core`, `uew_api`, `uew_backend.exe`, `uew_core_tests.exe`, `uew_thermal_tests.exe`, `uew_api_tests.exe` cleanly (0 errors/0 warnings) | MSBuild log |
| 2026-11-01 02:35 IST | Task 06 (Acceptance) | Win11 x64 / i7-1255U | `ctest --test-dir build -C Release --output-on-failure --verbose` | 0 | 3/3 tests passed (100%): `uew_core_tests`, `uew_thermal_tests` (nodal 81 rows, midpoint 80 rows with exact 0.01953125 C error, combined 161 rows), and `uew_api_tests` (GET/POST parity, query param parsing, malformed JSON rejection 400, non-integer elements 400, invalid type 400, 401 auth checks) | CTest log |
| 2026-11-01 02:35 IST | Task 06 (Acceptance) | Win11 x64 / i7-1255U | `npm run typecheck` | 0 | Typecheck passed for renderer and electron main/preload, 0 errors | TypeScript output |
| 2026-11-01 02:36 IST | Task 06 (Acceptance) | Win11 x64 / i7-1255U | `npm run build` | 0 | Vite renderer bundle built in 2.09s and Electron compiled via tsc, 0 errors | `dist/` |
| 2026-11-01 02:36 IST | Task 06 (Acceptance) | Win11 x64 / i7-1255U | `node scripts/run-electron.js . --test-autoclose=3000` | 0 | Full end-to-end integration: dynamic port 49679, token handshake (`INIT_TOKEN` -> `[TOKEN READY]`), 200 OK health check, React + Three.js WebGL viewport initialized, auto-closed with graceful `SHUTDOWN\n` and exit code 0 | Console log |
| 2026-11-01 02:36 IST | Task 06 (Acceptance) | Win11 x64 / i7-1255U | `Get-FileHash SHA256 (thermal files & test)` | 0 | All 4 FEM files verified byte-for-byte identical to baseline | File hashes |

Rules:
- Record actual environment and exact command.
- Preserve failure output and explain remediation.
- Distinguish local developer machine from clean-machine packaging validation.
- Do not infer a pass from code inspection.
