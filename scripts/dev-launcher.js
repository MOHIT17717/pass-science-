/**
 * Unified Engineering Workbench — Unified One-Command Development Launcher
 *
 * Automates:
 * 1. Windows x64 platform and environment validation.
 * 2. Visual Studio MSVC (vcvars64.bat) and CMake toolchain auto-discovery.
 * 3. Incremental C++ backend compilation (uew_backend.exe).
 * 4. Electron TypeScript compilation (dist/electron/main/index.js).
 * 5. Pre-flight port availability verification (port 5173).
 * 6. Vite development server startup with verified signature readiness polling.
 * 7. Electron application launch and unified session supervision.
 * 8. Guaranteed child process tree cleanup on exit, failure, or interruption.
 */

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const os = require('os');

const projectRoot = path.resolve(__dirname, '..');
const rawArgs = process.argv.slice(2);
const shutdownControlFile = path.join(os.tmpdir(), `uew-dev-shutdown-${process.pid}.ctrl`);
let viteProcess = null;
let electronProcess = null;
let isShuttingDown = false;
let shutdownOutcome = null;

function log(msg) {
  console.log(`[DEV LAUNCHER] ${msg}`);
}

function errorLog(msg) {
  console.error(`[DEV LAUNCHER ERROR] ${msg}`);
}

function isProcessAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

function killProcessTree(pid, name) {
  if (!pid) return;
  if (!isProcessAlive(pid)) {
    log(`Process ${name} (PID ${pid}) has already exited.`);
    return;
  }

  try {
    if (process.platform === 'win32') {
      const res = cp.spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });
      if (res.status === 0) {
        log(`Successfully terminated ${name} process tree (PID ${pid}).`);
      } else {
        const stderr = (res.stderr || '').trim();
        if (stderr.includes('not found') || !isProcessAlive(pid)) {
          log(`Process ${name} (PID ${pid}) exited during termination.`);
        } else {
          errorLog(`Warning: Failed to terminate ${name} (PID ${pid}): ${stderr}`);
        }
      }
    } else {
      process.kill(pid, 'SIGKILL');
      log(`Sent SIGKILL to ${name} (PID ${pid}).`);
    }
  } catch (err) {
    if (!isProcessAlive(pid)) {
      log(`Process ${name} (PID ${pid}) exited.`);
    } else {
      errorLog(`Error terminating ${name} (PID ${pid}): ${err.message}`);
    }
  }
}

function waitForChildExit(child, timeoutMs) {
  return new Promise((resolve) => {
    if (!child || !child.pid || child.exitCode !== null || !isProcessAlive(child.pid)) {
      resolve(true);
      return;
    }

    let timer = null;
    const onExit = () => {
      if (timer) clearTimeout(timer);
      resolve(true);
    };

    timer = setTimeout(() => {
      try {
        child.removeListener('exit', onExit);
      } catch {}
      resolve(!isProcessAlive(child.pid));
    }, timeoutMs);

    child.once('exit', onExit);
  });
}

async function shutdown(source, options = {}) {
  if (isShuttingDown) {
    log(`Already shutting down; ignoring duplicate shutdown request (${source}).`);
    return;
  }
  isShuttingDown = true;
  log(`Initiating shutdown (source: ${source})...`);

  const { forcedTimeoutMs = 3000, initialCode = 0, simulateFallback = false } = options;
  let exitCode = initialCode;

  // Step 1: Graceful teardown of Electron & C++ backend
  if (electronProcess && electronProcess.pid && isProcessAlive(electronProcess.pid)) {
    const electronPid = electronProcess.pid;

    if (!simulateFallback) {
      log('Requesting graceful Electron shutdown...');
      try {
        fs.writeFileSync(shutdownControlFile, 'SHUTDOWN\n', 'utf8');
      } catch (e) {
        errorLog(`Failed to write shutdown control file: ${e.message}`);
      }
      try {
        if (electronProcess.stdin && electronProcess.stdin.writable) {
          electronProcess.stdin.write('SHUTDOWN\n');
        }
      } catch {
        // Stdin pipe may already be closed
      }
    } else {
      log('[TEST] Simulating unresponsive child: suppressing graceful shutdown request.');
    }

    // Wait up to forcedTimeoutMs for Electron and backend to exit cleanly
    const exitedCleanly = await waitForChildExit(electronProcess, forcedTimeoutMs);
    if (exitedCleanly) {
      log('Electron and backend shut down gracefully.');
      shutdownOutcome = 'graceful';
    } else {
      errorLog(`Grace period elapsed (${forcedTimeoutMs}ms). Electron process tree failed to exit. Enforcing process-tree termination...`);
      shutdownOutcome = 'forced';
      exitCode = exitCode !== 0 ? exitCode : 1;
      killProcessTree(electronPid, 'Electron');
    }
  } else {
    log('Electron has already exited.');
    shutdownOutcome = 'graceful';
  }
  electronProcess = null;

  // Step 2: Terminate Vite dev server
  if (viteProcess && viteProcess.pid) {
    const vitePid = viteProcess.pid;
    viteProcess = null;
    killProcessTree(vitePid, 'Vite');
  }

  // Step 3: Report outcome and exit with documented status
  if (shutdownOutcome === 'forced') {
    errorLog('Shutdown completed with forced termination fallback.');
  } else {
    log('Graceful shutdown completed successfully.');
  }

  process.exit(exitCode);
}

function emergencyCleanup() {
  try {
    if (fs.existsSync(shutdownControlFile)) {
      fs.unlinkSync(shutdownControlFile);
    }
  } catch {}
  if (electronProcess && electronProcess.pid && isProcessAlive(electronProcess.pid)) {
    killProcessTree(electronProcess.pid, 'Electron');
    electronProcess = null;
  }
  if (viteProcess && viteProcess.pid) {
    killProcessTree(viteProcess.pid, 'Vite');
    viteProcess = null;
  }
}

process.on('SIGINT', () => {
  log('Received SIGINT (Ctrl+C).');
  const simulateFallback = rawArgs.includes('--test-force-fallback');
  const timeout = simulateFallback ? 500 : 3000;
  shutdown('SIGINT', { forcedTimeoutMs: timeout, initialCode: 0, simulateFallback });
});

process.on('SIGTERM', () => {
  log('Received SIGTERM.');
  const simulateFallback = rawArgs.includes('--test-force-fallback');
  const timeout = simulateFallback ? 500 : 3000;
  shutdown('SIGTERM', { forcedTimeoutMs: timeout, initialCode: 0, simulateFallback });
});

process.on('exit', () => {
  emergencyCleanup();
});

// Step 1: Validate Platform
function validatePlatform() {
  if (process.platform !== 'win32') {
    errorLog(`Unsupported platform: ${process.platform}. Unified Engineering Workbench requires Windows x64.`);
    process.exit(1);
  }
  const isX64 = process.arch === 'x64' || process.env.PROCESSOR_ARCHITECTURE === 'AMD64';
  if (!isX64) {
    errorLog(`Unsupported architecture: ${process.arch}. Unified Engineering Workbench requires x64.`);
    process.exit(1);
  }
  log(`Platform verified: Windows x64 (${process.arch})`);
}

// Step 2: Locate MSVC vcvars64.bat via vswhere or standard paths
function locateVcvars64() {
  const vswhereCandidates = [
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft Visual Studio', 'Installer', 'vswhere.exe'),
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Microsoft Visual Studio', 'Installer', 'vswhere.exe')
  ];

  let vswherePath = vswhereCandidates.find((p) => fs.existsSync(p));
  let vsInstallPath = null;

  if (vswherePath) {
    try {
      const out = cp.execFileSync(vswherePath, [
        '-latest',
        '-products', '*',
        '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
        '-property', 'installationPath'
      ], { encoding: 'utf8' }).trim();
      if (out && fs.existsSync(out)) {
        vsInstallPath = out;
      }
    } catch (err) {
      // Fall through to manual candidates
    }
  }

  if (vsInstallPath) {
    const candidate = path.join(vsInstallPath, 'VC', 'Auxiliary', 'Build', 'vcvars64.bat');
    if (fs.existsSync(candidate)) {
      log(`Located MSVC environment via vswhere: ${candidate}`);
      return { vcvars64Path: candidate, vsInstallPath };
    }
  }

  // Fallback candidates
  const fallbackCandidates = [
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\18\\BuildTools\\VC\\Auxiliary\\Build\\vcvars64.bat',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Auxiliary\\Build\\vcvars64.bat',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\VC\\Auxiliary\\Build\\vcvars64.bat',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional\\VC\\Auxiliary\\Build\\vcvars64.bat',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\VC\\Auxiliary\\Build\\vcvars64.bat',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\BuildTools\\VC\\Auxiliary\\Build\\vcvars64.bat',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\VC\\Auxiliary\\Build\\vcvars64.bat'
  ];

  for (const cand of fallbackCandidates) {
    if (fs.existsSync(cand)) {
      log(`Located MSVC environment via fallback search: ${cand}`);
      return { vcvars64Path: cand, vsInstallPath: path.resolve(cand, '../../../../..') };
    }
  }

  errorLog('Visual Studio C++ x64 Build Tools (vcvars64.bat) could not be located.');
  errorLog('Please ensure Visual Studio 2022 or Build Tools with the C++ x64/x86 build tools component is installed.');
  process.exit(1);
}

// Step 3: Locate CMake binary
function locateCmake(vsInstallPath) {
  // First check if cmake is in system PATH
  try {
    const out = cp.execSync('cmake --version', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const match = out.match(/cmake version (\d+)\.(\d+)/i);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major > 3 || (major === 3 && minor >= 20)) {
        log(`Located CMake in system PATH (version ${major}.${minor})`);
        return 'cmake';
      }
    }
  } catch (err) {
    // Not in PATH
  }

  // Search standard paths
  const cmakeCandidates = [
    'C:\\Program Files\\CMake\\bin\\cmake.exe',
    'C:\\Program Files (x86)\\CMake\\bin\\cmake.exe'
  ];

  if (vsInstallPath) {
    cmakeCandidates.push(
      path.join(vsInstallPath, 'Common7', 'IDE', 'CommonExtensions', 'Microsoft', 'CMake', 'CMake', 'bin', 'cmake.exe')
    );
  }

  for (const cand of cmakeCandidates) {
    if (fs.existsSync(cand)) {
      try {
        const out = cp.execFileSync(cand, ['--version'], { encoding: 'utf8' });
        const match = out.match(/cmake version (\d+)\.(\d+)/i);
        if (match) {
          const major = parseInt(match[1], 10);
          const minor = parseInt(match[2], 10);
          if (major > 3 || (major === 3 && minor >= 20)) {
            log(`Located CMake binary: ${cand} (version ${major}.${minor})`);
            return cand;
          }
        }
      } catch (e) {
        // Continue
      }
    }
  }

  errorLog('CMake >= 3.20 was not found. Please install CMake or ensure Visual Studio C++ CMake tools are installed.');
  process.exit(1);
}

// Step 4: Execute C++ Backend Build
function buildBackend(vcvars64Path, cmakePath) {
  log('Executing incremental build of C++ backend (target: uew_backend)...');
  const buildDir = path.join(projectRoot, 'build');
  const cacheFile = path.join(buildDir, 'CMakeCache.txt');

  if (!fs.existsSync(cacheFile)) {
    log('CMake build directory not configured. Running initial configuration...');
    const configCmd = `call "${vcvars64Path}" && "${cmakePath}" -S . -B build -A x64`;
    try {
      cp.execSync(configCmd, {
        cwd: projectRoot,
        stdio: 'inherit'
      });
    } catch (err) {
      errorLog(`CMake configure failed: ${err.message}`);
      process.exit(1);
    }
  }

  const buildCmd = `call "${vcvars64Path}" && "${cmakePath}" --build build --config Release --target uew_backend`;
  try {
    cp.execSync(buildCmd, {
      cwd: projectRoot,
      stdio: 'inherit'
    });
  } catch (err) {
    errorLog(`C++ backend build failed: ${err.message}`);
    process.exit(1);
  }

  const backendExe = path.join(projectRoot, 'build', 'Release', 'uew_backend.exe');
  if (!fs.existsSync(backendExe)) {
    errorLog(`Backend executable not found at expected path: ${backendExe}`);
    process.exit(1);
  }
  const stat = fs.statSync(backendExe);
  log(`Backend built successfully: ${backendExe} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// Step 5: Compile Electron TypeScript
function compileElectronTs() {
  log('Compiling Electron TypeScript (electron/tsconfig.json)...');
  const tscBin = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
  const tsconfig = path.join(projectRoot, 'electron', 'tsconfig.json');

  const res = cp.spawnSync(process.execPath, [tscBin, '-p', tsconfig], {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  if (res.status !== 0) {
    errorLog(`Electron TypeScript compilation failed with exit code ${res.status}`);
    process.exit(res.status || 1);
  }

  const mainJs = path.join(projectRoot, 'dist', 'electron', 'main', 'index.js');
  if (!fs.existsSync(mainJs)) {
    errorLog(`Compiled Electron entrypoint not found: ${mainJs}`);
    process.exit(1);
  }
  log('Electron TypeScript compiled successfully.');
}

// Step 6: Pre-flight check for port availability
function checkPortAvailable(port = 5173, host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use by another process. Please terminate the conflicting process before running npm run dev.`));
      } else {
        reject(new Error(`Unable to verify port ${port} availability: ${err.message}`));
      }
    });

    server.once('listening', () => {
      server.close(() => resolve());
    });

    server.listen(port, host);
  });
}

// Step 7: Bounded HTTP readiness check for Vite dev server with signature validation
function waitForVite(port = 5173, maxWaitMs = 30000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    log(`Waiting for Vite dev server on http://127.0.0.1:${port}/ (timeout: ${maxWaitMs / 1000}s)...`);
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          // Validate server identity: must return HTTP 200 containing Vite client script
          if (res.statusCode === 200 && (body.includes('@vite/client') || body.includes('vite/client'))) {
            log(`Vite dev server is ready and verified (HTTP 200, Vite client signature confirmed).`);
            resolve();
          } else if (res.statusCode === 200) {
            reject(new Error(`Port ${port} responded with HTTP 200, but did not match Vite dev server signature.`));
          } else {
            if (Date.now() - startTime > maxWaitMs) {
              reject(new Error(`Timeout waiting for Vite dev server on port ${port} (last HTTP status: ${res.statusCode})`));
            } else {
              setTimeout(check, 250);
            }
          }
        });
      });

      req.on('error', () => {
        if (Date.now() - startTime > maxWaitMs) {
          reject(new Error(`Timeout waiting for Vite dev server on port ${port} after ${maxWaitMs}ms`));
        } else {
          setTimeout(check, 250);
        }
      });

      req.setTimeout(1000, () => {
        req.destroy();
        if (Date.now() - startTime > maxWaitMs) {
          reject(new Error(`Timeout waiting for Vite dev server on port ${port} after ${maxWaitMs}ms`));
        } else {
          setTimeout(check, 250);
        }
      });
    };

    check();
  });
}

// Main execution routine
async function main() {
  log('Starting Unified Engineering Workbench Development Workflow...');

  const isBuildOnly = rawArgs.includes('--build-only');

  // Filter out launcher-specific flags
  const forwardedArgs = rawArgs.filter((arg) =>
    arg !== '--build-only' &&
    arg !== '--test-force-fallback' &&
    arg !== '--test-duplicate-signals' &&
    !arg.startsWith('--test-signal-sigint-after=')
  );

  // 1. Validate platform
  validatePlatform();

  // 2. Discover toolchains
  const { vcvars64Path, vsInstallPath } = locateVcvars64();
  const cmakePath = locateCmake(vsInstallPath);

  // 3. Build C++ backend
  buildBackend(vcvars64Path, cmakePath);

  // 4. Compile Electron TS
  compileElectronTs();

  if (isBuildOnly) {
    log('Build-only mode complete. All components ready.');
    process.exit(0);
  }

  // 5. Pre-flight check: ensure port 5173 is available before launching Vite
  try {
    await checkPortAvailable(5173, '127.0.0.1');
  } catch (err) {
    errorLog(err.message);
    process.exit(1);
  }

  // 6. Start Vite Dev Server
  log('Starting Vite development server...');
  const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  const viteConfigFile = path.join(projectRoot, 'frontend', 'vite.config.ts');

  viteProcess = cp.spawn(process.execPath, [viteBin, '--config', viteConfigFile], {
    cwd: projectRoot,
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  viteProcess.on('error', (err) => {
    errorLog(`Failed to start Vite dev server process (${viteBin}): ${err.message}`);
    emergencyCleanup();
    process.exit(1);
  });

  viteProcess.stdout.on('data', (d) => {
    const str = d.toString();
    if (str.includes('ready in') || str.includes('Local:')) {
      process.stdout.write(`[VITE] ${str}`);
    }
  });

  viteProcess.stderr.on('data', (d) => {
    process.stderr.write(`[VITE ERROR] ${d.toString()}`);
  });

  viteProcess.on('exit', (code, sig) => {
    if (!isShuttingDown) {
      errorLog(`Vite dev server exited unexpectedly (code: ${code}, signal: ${sig})`);
      emergencyCleanup();
      process.exit(code || 1);
    }
  });

  // 7. Wait for Vite server readiness with verified server signature
  try {
    await waitForVite(5173, 30000);
  } catch (err) {
    errorLog(`Vite readiness failure: ${err.message}`);
    emergencyCleanup();
    process.exit(1);
  }

  // 8. Spawn Electron with clean environment
  log('Launching Electron application...');
  const electronScript = path.join(projectRoot, 'scripts', 'run-electron.js');
  const electronArgs = [electronScript, ...forwardedArgs];

  const electronEnv = {
    ...process.env,
    NODE_ENV: 'development',
    VITE_DEV_SERVER_URL: 'http://127.0.0.1:5173',
    DEV_SHUTDOWN_FILE: shutdownControlFile
  };

  // Strictly remove inherited test variables from parent shell
  delete electronEnv.TEST_WORKBENCH_VERIFY;
  delete electronEnv.TEST_AUTOCLOSE;

  // Only pass test variables if explicit test flags are present in CLI arguments
  for (const arg of forwardedArgs) {
    if (arg.startsWith('--test-autoclose=')) {
      electronEnv.TEST_AUTOCLOSE = arg.split('=')[1];
    } else if (arg === '--test-autoclose') {
      electronEnv.TEST_AUTOCLOSE = '3000';
    } else if (arg === '--test-verify') {
      electronEnv.TEST_WORKBENCH_VERIFY = '1';
    }
  }

  electronProcess = cp.spawn(process.execPath, electronArgs, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: electronEnv
  });

  const sigintDelayArg = rawArgs.find((a) => a.startsWith('--test-signal-sigint-after='));
  if (sigintDelayArg) {
    const delayMs = parseInt(sigintDelayArg.split('=')[1], 10) || 4000;
    setTimeout(() => {
      log(`[TEST HOOK] Triggering simulated SIGINT after ${delayMs}ms...`);
      process.emit('SIGINT');
      if (rawArgs.includes('--test-duplicate-signals')) {
        setTimeout(() => process.emit('SIGINT'), 20);
        setTimeout(() => process.emit('SIGINT'), 50);
      }
    }, delayMs);
  }

  electronProcess.on('error', (err) => {
    errorLog(`Failed to start Electron process (${electronScript}): ${err.message}`);
    emergencyCleanup();
    process.exit(1);
  });

  electronProcess.on('exit', (code, sig) => {
    log(`Electron process exited (code: ${code}, signal: ${sig}).`);
    if (!isShuttingDown) {
      const targetCode = code !== null ? code : (sig ? 1 : 0);
      shutdown('electron-exit', { forcedTimeoutMs: 500, initialCode: targetCode });
    }
  });
}

main().catch((err) => {
  errorLog(`Unexpected launcher failure: ${err.stack || err.message}`);
  emergencyCleanup();
  process.exit(1);
});
