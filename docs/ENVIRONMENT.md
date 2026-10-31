# Development Environment Audit & Baseline

Date checked: 2026-10-31 (Local Time: 23:19 IST)

## 1. Operating System & Platform
- **Windows Edition**: Windows 11 Home Single Language (reported as `Windows 10 Home Single Language` / `CoreSingleLanguage` with DisplayVersion `26H2`, Build Branch `ge_release` in registry)
- **Windows Version / Build**: Version 10.0.26300.9818 (Build 26300, UBR 9818)
- **OS Architecture**: 64-bit AMD64 (`AMD64`, `[System.Environment]::Is64BitOperatingSystem: True`)
- **Verification Evidence**:
  - `[System.Environment]::OSVersion` -> `Microsoft Windows NT 10.0.26300.0` (Exit code 0)
  - `cmd /c ver` -> `Microsoft Windows [Version 10.0.26300.9818]` (Exit code 0)
  - `Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion"` -> `DisplayVersion: 26H2`, `CurrentBuildNumber: 26300`, `UBR: 9818`, `BuildBranch: ge_release` (Exit code 0)

## 2. Hardware Specifications
- **CPU Model**: 12th Gen Intel(R) Core(TM) i7-1255U @ 2.60 GHz
- **Physical Cores**: 10 (2 Performance cores + 8 Efficient cores)
- **Logical Processors**: 12 threads
- **Installed RAM**: 16,874,135,552 bytes (~16.0 GB / 15.71 GiB)
- **Verification Evidence**:
  - `HKLM:\HARDWARE\DESCRIPTION\System\CentralProcessor\0\ProcessorNameString` -> `12th Gen Intel(R) Core(TM) i7-1255U` (Exit code 0)
  - `Win32 GetLogicalProcessorInformationEx(RelationProcessorCore)` -> `10` physical cores (Exit code 0)
  - `$env:NUMBER_OF_PROCESSORS` -> `12` logical processors (Exit code 0)
  - `Win32 GlobalMemoryStatusEx(ullTotalPhys)` -> `16874135552` bytes (Exit code 0)

## 3. Graphics & 3D Acceleration
- **GPU Hardware**: Intel(R) Iris(R) Xe Graphics
- **Driver Version**: 32.0.101.6733 (Intel Corporation)
- **OpenGL Capability**: OpenGL 4.6.0 native hardware support
- **Verification Evidence**:
  - `HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}` -> `Intel(R) Iris(R) Xe Graphics`, Driver Version `32.0.101.6733` (Exit code 0)
  - `C:\Windows\System32\opengl32.dll` -> File exists, Version `10.0.26100.9818` (Exit code 0)
  - Direct WGL/OpenGL Context query via `glGetString`:
    - `GL_VENDOR`: `Intel`
    - `GL_RENDERER`: `Intel(R) Iris(R) Xe Graphics`
    - `GL_VERSION`: `4.6.0 - Build 32.0.101.6733` (Exit code 0)

## 4. Version Control
- **Git Version**: `git version 2.46.2.windows.1`
- **Git Repository Status**: Initialized on branch `master` (Baseline commit: `ebac724`; Task 03 completion commit: `a59e721`)
- **Git User Identity Configured**:
  - Name: `MOHIT17717`
  - Email: `mohit17717@gmail.com`
- **Verification Evidence**:
  - `git --version` -> `git version 2.46.2.windows.1` (Exit code 0)
  - `git status` -> On branch master (Exit code 0)
  - `git log -1` -> Commit `ebac724af5bd33780a1ad58a2a1b072d95f24d6a` (Exit code 0)
  - `git config --list` -> `user.name=MOHIT17717`, `user.email=mohit17717@gmail.com` (Exit code 0)

## 5. Software Build Toolchain & Dependencies Status
- **C++ Compiler**: **INSTALLED AND VERIFIED (x64)**
  - Compiler: Microsoft (R) C/C++ Optimizing Compiler Version 19.51.36260 for x64
  - Environment: Visual Studio 2026 Developer Command Prompt v18.11.3 (BuildTools)
  - Toolset path: `C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Tools\MSVC\14.51.36231\bin\Hostx64\x64\cl.exe`
  - Target Architecture: x64 (`VSCMD_ARG_TGT_ARCH=x64`)
  - Windows SDK: `10.0.26100.0`
  - Verification Evidence:
    - `cmd /c "vcvars64.bat && cl.exe"` -> Version 19.51.36260 for x64 (Exit code 0)
- **CMake**: **INSTALLED AND VERIFIED**
  - Version: `4.5.0-rc2`
  - Path: `C:\Program Files\CMake\bin\cmake.exe`
  - Generator: `Visual Studio 18 2026 -A x64`
  - Verification Evidence:
    - `cmake --version` -> `cmake version 4.5.0-rc2` (Exit code 0)
- **Qt 6 & Kits**: **NOT INSTALLED / NO LONGER REQUIRED**
  - Architecture status: Removed from approved stack per ADR-002 (Electron + React + TypeScript + Three.js + C++17 backend); Qt is no longer a prerequisite.
  - Verification Evidence:
    - `where.exe qmake` -> Not found (Exit code 1)
    - Checked `C:\Qt` and `D:\Qt` -> Directory does not exist (Exit code 0)
    - No Qt installations found in standard program directories.
- **Node.js & npm (Host Development Environment)**: **INSTALLED AND VERIFIED**
  - Host Node.js Version: `v22.20.0` (path: `C:\Program Files\nodejs\node.exe`)
  - Host npm Version: `11.11.1` (path: `C:\Program Files\nodejs\npm.cmd`)
  - Role: Drives frontend compilation, TypeScript checking, and dev orchestration.
- **Electron Desktop Shell Runtime (Target)**: **SPECIFIED & DOCUMENTED (ADR-010)**
  - Electron Version: `45.2.1`
  - Bundled Chromium Version: `156.0.8078.75`
  - Embedded Node.js Version: `24.22.1` (bundled internally within the Electron runtime, distinct from Host Node.js `22.20.0`)
  - Role: Runs the desktop application shell, main process, and sandboxed Chromium renderer.
- **Process Lifecycle Protocol Status**:
  - `SHUTDOWN` stdin protocol is documented as the planned graceful shutdown contract; remains **unverified** until the C++ backend implements its stdin reader and signal handling in Task 05.
- **Ninja / Build Automation**: **NOT INSTALLED / NOT IN PATH**
  - `where.exe ninja` -> Not found (Exit code 1)

## 6. Build Status & Blocker Summary
- **Current Build Readiness**: **READY FOR CORE BUILD AND TESTS**
- **Prerequisites Status for Approved Architecture (Electron + React + C++17 Backend)**:
  1. C++17 Compiler: **VERIFIED** (MSVC 19.51.36260 x64).
  2. CMake 3.20+: **VERIFIED** (CMake 4.5.0-rc2).
  3. C++ Core Build & CTest: **VERIFIED** (`uew_core.lib` and `uew_core_tests.exe` built and 100% passed in Task 03).
  4. Host Node.js & npm: **VERIFIED** (`node v22.20.0`, `npm 11.11.1`).
  5. Electron Desktop Shell Target: **SPECIFIED** (`45.2.1`, Chromium `156.0.8078.75`, Embedded Node.js `24.22.1`).
  6. Baseline Git repository: **INITIALIZED** (`ebac724`).
  7. Qt 6: **NOT NEEDED** (superseded by Electron + React + Three.js frontend).
