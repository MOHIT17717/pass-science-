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

Rules:
- Record actual environment and exact command.
- Preserve failure output and explain remediation.
- Distinguish local developer machine from clean-machine packaging validation.
- Do not infer a pass from code inspection.
