# UNIFIED ENGINEERING WORKBENCH
## Complete Installation, Build & Execution Guide (2-Page Reference)

**Author:** Mohit S K • SRM Institute of Science and Technology (2023–2027)  
**Primary Contact:** mohit17717@gmail.com | ms1131@srmist.edu.in  
**Repository:** https://github.com/MOHIT17717/pass-science-.git | **Version:** 1.0.0 (Windows 11 x64)  

---
<!-- ========================================================================================= -->
<!--                                        PAGE 1 OF 2                                        -->
<!-- ========================================================================================= -->

## PART 1: Fast-Track Standalone Execution (Evaluator / End-User Mode)
The standalone release is completely portable and self-contained. It operates out-of-the-box on clean Windows 11/10 64-bit systems with **zero external prerequisites** (no Node.js, CMake, Visual Studio, Python, or administrative rights required).

### 1.1 Download Package & Verify Integrity
* **Distribution Archive:** `CandidateID_Workbench.zip` (154.7 MB / 162,204,375 bytes)
* **Official Vercel Blob Download:**  
  `https://jcafrzfdr7rjkbxw.public.blob.vercel-storage.com/CandidateID_Workbench.zip?download=1`
* **Verified SHA-256 Checksum:**  
  `01EF5F8BC6D8DC3597D8DD918991540E686ACF5B449F7A1284C8A9DD453C67A0`
* **Integrity Check (PowerShell):**
  ```powershell
  Get-FileHash -Path ".\CandidateID_Workbench.zip" -Algorithm SHA256
  ```

### 1.2 Running the Standalone Application
1. **Extract Archive:** Right-click `CandidateID_Workbench.zip` $\to$ **Extract All...** to any local folder (e.g., `C:\Engineering\Workbench\` or Desktop).
2. **Execute Launcher:** Open the extracted directory and double-click `Launch.exe`.
3. **Windows SmartScreen First-Launch Notice:**  
   Because this independent engineering build is not signed with a commercial EV certificate, Windows Defender SmartScreen may display: *"Windows protected your PC"*.  
   $\to$ Click **"More info"** $\to$ Click **"Run anyway"**.
4. **Automated Startup Sequence:** `Launch.exe` automatically provisions an ephemeral loopback socket on `127.0.0.1`, generates a 256-bit session authentication token, spawns the compiled C++ backend (`bin/uew_backend.exe`), and opens the hardware-accelerated user interface.

### 1.3 In-App Module Verification Checklist
Once the workbench opens, verify all five functional modules:
* **CAD 3D Viewport:** Click *"Load Sample Bracket"* $\to$ Verify 3D bracket mesh renders in WebGL with interactive OrbitControls (rotate, pan, zoom).
* **Thermal FEM Solver:** Click *"Run Simulation"* $\to$ Verify 2D heat equation field converges, colormap renders, and synthetic ANSYS comparison norms display ($L_2$ error, Pearson $r > 0.99$).
* **Multicore Benchmark:** Select 500k operations $\to$ Click *"Run Benchmark"* $\to$ Verify execution times across 1, 2, and 4 concurrent C++ worker threads with Amdahl's Law speedup curves.
* **Embedded Hardware Bus:** Select UART/SPI/I2C $\to$ Click *"Connect Bus"* $\to$ Verify streaming telemetry packets. Click *"Inject Timeout Fault"* $\to$ Verify automatic state-machine recovery.
* **Neural Backpropagation:** Click *"Start Training"* $\to$ Observe real-time MSE loss curve descent computed in native C++. Click *"Export Weights CSV"* to download trained weight matrices.
* **Graceful Exit:** Close window or press `Alt + F4` $\to$ C++ backend receives shutdown token and terminates with zero orphaned processes.

---
<!-- ========================================================================================= -->
<!--                                        PAGE 2 OF 2                                        -->
<!-- ========================================================================================= -->

## PART 2: Complete Developer Build from Scratch (Source-to-Binary Pipeline)
To compile, link, and package the complete project from clean source code on Windows 11 x64:

### 2.1 Developer Environment Prerequisites
| Component | Minimum Specification | Verification Command |
| :--- | :--- | :--- |
| **Operating System** | Windows 11 / 10 64-bit (x86-64) | `[System.Environment]::OSVersion` |
| **C++ Toolchain** | MSVC v143 (Visual Studio 2022 Build Tools) | `cl.exe` |
| **Build System** | CMake 3.20 or newer | `cmake --version` |
| **Runtime Environment** | Node.js v20.x or v22.x LTS & npm 10+ | `node -v; npm -v` |
| **Git Client** | Git for Windows | `git --version` |

### 2.2 Step-by-Step Build & Execution Sequence
Run the following commands in order from PowerShell:

```powershell
# 1. Clone Repository & Navigate to Workspace
git clone https://github.com/MOHIT17717/pass-science-.git
cd pass-science-

# 2. Configure & Compile Native C++ Engineering Backend (C++17)
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release

# 3. Install Node.js & Electron Dependencies (Root Desktop Workspace)
npm install

# 4. Verify Native Tests & Numerical Accuracy
.\build\Release\test_fem.exe

# 5. Launch Application in Development Mode
npm start
```

### 2.3 Standalone Packaging Pipeline (Producing CandidateID_Workbench.zip)
To reproduce the exact production standalone ZIP with bundled MSVC runtime DLLs and `Launch.exe`:

```powershell
# Build Electron production bundles and copy C++ binaries into standalone release tree
npm run build
npm run package:standalone

# The standalone package will be generated at:
# release/CandidateID_Workbench/
# release/CandidateID_Workbench.zip
# release/CandidateID_Workbench.zip.sha256
```

### 2.4 Architectural Safety & Troubleshooting
* **Loopback Security:** The backend listens strictly on `127.0.0.1` using an ephemeral port. It will never request firewall port exceptions or expose network interfaces.
* **Port Conflict Recovery:** If the default port is blocked, `Launch.exe` automatically negotiates the next available ephemeral port.
* **Runtime DLL Resolution:** All required MSVC runtime libraries (`vcruntime140.dll`, `msvcp140.dll`) are placed directly in `bin/` alongside `uew_backend.exe` to guarantee zero machine dependency.
* **Working Tree Cleanliness:** Baseline FEM solver files (`src/core/thermal/FEMSolver.cpp`, `FEMSolver.h`, `ThermalModels.h`, `tests/test_fem.cpp`) remain 100% byte-for-byte identical to baseline SHA-256 hashes.

