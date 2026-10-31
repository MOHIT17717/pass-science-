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
- **Git Repository Status**: Not initialized (`fatal: not a git repository (or any of the parent directories): .git`)
- **Git User Identity Configured**:
  - Name: `MOHIT17717`
  - Email: `mohit17717@gmail.com`
- **Verification Evidence**:
  - `git --version` -> `git version 2.46.2.windows.1` (Exit code 0)
  - `git status` -> `fatal: not a git repository` (Exit code 1)
  - `git config --list` -> `user.name=MOHIT17717`, `user.email=mohit17717@gmail.com` (Exit code 0)

## 5. Software Build Toolchain & Dependencies Status
- **C++ Compiler**: **NOT INSTALLED / NOT IN PATH [BLOCKED]**
  - Verification Evidence:
    - `where.exe cl` -> Not found (Exit code 1)
    - `where.exe gcc` -> Not found (Exit code 1)
    - `where.exe clang` -> Not found (Exit code 1)
    - Checked `C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe` -> False
    - Registry inspection shows Microsoft Visual C++ 2013 and v14 Redistributables (x86/x64) installed, but no MSVC compiler/build tools.
- **CMake**: **NOT INSTALLED / NOT IN PATH [BLOCKED]**
  - Verification Evidence:
    - `cmake --version` -> CommandNotFoundException (Exit code 1)
    - `where.exe cmake` -> Not found (Exit code 1)
- **Qt 6 & Kits**: **NOT INSTALLED / NO LONGER REQUIRED**
  - Architecture status: Removed from approved stack per ADR-002 (Electron + React + TypeScript + Three.js + C++17 backend); Qt is no longer a prerequisite.
  - Verification Evidence:
    - `where.exe qmake` -> Not found (Exit code 1)
    - Checked `C:\Qt` and `D:\Qt` -> Directory does not exist (Exit code 0)
    - No Qt installations found in standard program directories.
- **Node.js & npm**: **INSTALLED AND VERIFIED**
  - Verification Evidence:
    - `node --version` -> `v22.20.0` (Exit code 0, path: `C:\Program Files\nodejs\node.exe`)
    - `npm --version` -> `11.11.1` (Exit code 0, path: `C:\Program Files\nodejs\npm.cmd`)
- **Ninja / Build Automation**: **NOT INSTALLED / NOT IN PATH**
  - `where.exe ninja` -> Not found (Exit code 1)

## 6. Build Status & Blocker Summary
- **Current Build Readiness**: **BLOCKED** on missing C++ build toolchain (MSVC compiler and CMake).
- **Prerequisites Status for Approved Architecture (Electron + React + C++17 Backend)**:
  1. C++17 Compiler: **BLOCKED** (MSVC x64 via Visual Studio 2022 Build Tools recommended).
  2. CMake 3.20+: **BLOCKED** (command-line tool missing in PATH).
  3. Node.js & npm: **AVAILABLE** (`node v22.20.0`, `npm 11.11.1`).
  4. Qt 6: **NOT NEEDED** (superseded by Electron + React + Three.js frontend).
  5. Baseline Git repository: **PENDING** (`git init` awaiting explicit user authorization).
