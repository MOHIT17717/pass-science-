/**
 * Unified Engineering Workbench — Standalone Windows 11 x64 Packaging Script
 *
 * Produces:
 * 1. release/CandidateID_Workbench/ (Fully self-contained distribution directory)
 * 2. release/CandidateID_Workbench.zip (Submission archive with top-level Launch.exe)
 * 3. release/CandidateID_Workbench.zip.sha256 (Cryptographic verification checksum)
 *
 * Requirements satisfied:
 * - Standalone desktop execution via Launch.exe without Node.js, CMake, Python, or Visual Studio.
 * - Bundles prebuilt Electron 45.2.1 x64 runtime and Chromium binaries.
 * - Bundles native C++17 backend (uew_backend.exe) and required MSVC runtime DLLs.
 * - Bundles compiled React/Three.js frontend and sandboxed Electron main/preload.
 * - Bundles sample CAD/ANSYS datasets in resources/data/.
 * - Bundles complete source code, tests, CMakeLists.txt, .vscode configurations, and documentation.
 * - Fully offline execution; no network access or external downloads required.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const releaseRoot = path.join(projectRoot, 'release');
const distName = 'CandidateID_Workbench';
const distDir = path.join(releaseRoot, distName);
const zipPath = path.join(releaseRoot, `${distName}.zip`);
const shaPath = path.join(releaseRoot, `${distName}.zip.sha256`);

function log(msg) {
  console.log(`[PACKAGER] ${msg}`);
}

function errorLog(msg) {
  console.error(`[PACKAGER ERROR] ${msg}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFileSafe(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirRecursive(srcDir, destDir, options = {}) {
  const { excludeNames = new Set() } = options;
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (excludeNames.has(entry.name)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, options);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function calculateFileSha256(filePath) {
  const hash = crypto.createHash('sha256');
  const buffer = fs.readFileSync(filePath);
  hash.update(buffer);
  return hash.digest('hex').toUpperCase();
}

function locateMsvcRedistDlls() {
  log('Scanning for MSVC C++ x64 runtime redistributables...');
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\18\\BuildTools\\VC\\Redist\\MSVC\\14.51.36231\\x64\\Microsoft.VC145.CRT',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Redist\\MSVC',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\VC\\Redist\\MSVC'
  ];

  let foundDir = null;
  if (fs.existsSync(candidates[0])) {
    foundDir = candidates[0];
  } else {
    for (const base of candidates.slice(1)) {
      if (!fs.existsSync(base)) continue;
      try {
        const versions = fs.readdirSync(base);
        for (const v of versions) {
          const crtDir = path.join(base, v, 'x64', 'Microsoft.VC143.CRT');
          if (fs.existsSync(crtDir)) {
            foundDir = crtDir;
            break;
          }
        }
      } catch {}
      if (foundDir) break;
    }
  }

  const dllsToCopy = [];
  if (foundDir) {
    log(`Located official MSVC CRT redistributable directory: ${foundDir}`);
    const files = fs.readdirSync(foundDir);
    for (const f of files) {
      if (f.toLowerCase().endsWith('.dll')) {
        dllsToCopy.push({ name: f, path: path.join(foundDir, f) });
      }
    }
  }

  // Fallback to System32 for essential core runtime if redist folder was not located
  const system32 = path.join(process.env.WINDIR || 'C:\\Windows', 'System32');
  const essential = ['msvcp140.dll', 'vcruntime140.dll', 'vcruntime140_1.dll'];
  for (const name of essential) {
    if (!dllsToCopy.some(d => d.name.toLowerCase() === name.toLowerCase())) {
      const p = path.join(system32, name);
      if (fs.existsSync(p)) {
        dllsToCopy.push({ name, path: p });
      }
    }
  }

  log(`Discovered ${dllsToCopy.length} MSVC runtime DLLs to bundle.`);
  return dllsToCopy;
}

async function runPackaging() {
  const startTime = Date.now();
  console.log('===============================================================');
  console.log('  Unified Engineering Workbench — Standalone Packaging Build   ');
  console.log('===============================================================');

  // Step 1: Pre-flight checks
  log('Validating compiled prerequisite artifacts...');
  const backendBinary = path.join(projectRoot, 'build', 'Release', 'uew_backend.exe');
  const electronDist = path.join(projectRoot, 'node_modules', 'electron', 'dist');
  const rendererIndex = path.join(projectRoot, 'dist', 'renderer', 'index.html');
  const mainIndex = path.join(projectRoot, 'dist', 'electron', 'main', 'index.js');
  const preloadIndex = path.join(projectRoot, 'dist', 'electron', 'preload', 'index.js');

  const missing = [];
  if (!fs.existsSync(backendBinary)) missing.push(`Backend executable: ${backendBinary}`);
  if (!fs.existsSync(electronDist)) missing.push(`Electron runtime: ${electronDist}`);
  if (!fs.existsSync(rendererIndex)) missing.push(`Renderer build: ${rendererIndex}`);
  if (!fs.existsSync(mainIndex)) missing.push(`Electron main build: ${mainIndex}`);
  if (!fs.existsSync(preloadIndex)) missing.push(`Electron preload build: ${preloadIndex}`);

  if (missing.length > 0) {
    errorLog('Prerequisites missing! Run "npm run build" first:');
    missing.forEach(m => errorLog(`  - ${m}`));
    process.exit(1);
  }
  log('All compiled prerequisite artifacts verified.');

  // Step 2: Clean and initialize output release directory
  log(`Initializing release directory: ${distDir}`);
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath, { force: true });
  }
  if (fs.existsSync(shaPath)) {
    fs.rmSync(shaPath, { force: true });
  }
  ensureDir(distDir);

  // Step 3: Copy Electron runtime and establish Launch.exe
  log('Copying Electron runtime binaries and Chromium dependencies...');
  copyDirRecursive(electronDist, distDir);

  const electronExe = path.join(distDir, 'electron.exe');
  const launchExe = path.join(distDir, 'Launch.exe');
  if (fs.existsSync(electronExe)) {
    fs.renameSync(electronExe, launchExe);
    log(`Established primary top-level entry point: Launch.exe (${(fs.statSync(launchExe).size / (1024 * 1024)).toFixed(2)} MB)`);
  } else {
    errorLog('electron.exe was not found in electron/dist!');
    process.exit(1);
  }

  // Remove default demo app
  const defaultAppAsar = path.join(distDir, 'resources', 'default_app.asar');
  if (fs.existsSync(defaultAppAsar)) {
    fs.rmSync(defaultAppAsar, { force: true });
    log('Removed default_app.asar template.');
  }

  // Step 4: Assemble resources/app/
  log('Assembling resources/app/ application bundle...');
  const appDir = path.join(distDir, 'resources', 'app');
  ensureDir(appDir);

  // Write minimal production package.json directing Launch.exe to the compiled entry point
  const appPackageJson = {
    name: 'unified-engineering-workbench',
    version: '0.1.0',
    description: 'Unified Engineering Workbench standalone desktop application',
    private: true,
    main: 'dist/electron/main/index.js'
  };
  fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(appPackageJson, null, 2), 'utf8');

  // Copy compiled Electron main & preload
  copyDirRecursive(path.join(projectRoot, 'dist', 'electron'), path.join(appDir, 'dist', 'electron'));

  // Copy compiled Vite React + Three.js renderer
  copyDirRecursive(path.join(projectRoot, 'dist', 'renderer'), path.join(appDir, 'dist', 'renderer'));
  log('Packaged sandboxed Electron scripts and production React UI into resources/app/');

  // Step 5: Assemble resources/backend/ with native executable and MSVC runtime DLLs
  log('Assembling resources/backend/ native engineering engine...');
  const backendTargetDir = path.join(distDir, 'resources', 'backend');
  ensureDir(backendTargetDir);

  copyFileSafe(backendBinary, path.join(backendTargetDir, 'uew_backend.exe'));
  log(`Staged native C++ backend: uew_backend.exe (${(fs.statSync(backendBinary).size / 1024).toFixed(1)} KB)`);

  const redistDlls = locateMsvcRedistDlls();
  for (const dll of redistDlls) {
    copyFileSafe(dll.path, path.join(backendTargetDir, dll.name));
    log(`  - Bundled runtime DLL: ${dll.name} (${(fs.statSync(dll.path).size / 1024).toFixed(1)} KB)`);
  }

  // Step 6: Assemble resources/data/ with CAD and ANSYS benchmark datasets
  log('Assembling resources/data/ benchmark datasets...');
  const dataTargetDir = path.join(distDir, 'resources', 'data');
  copyFileSafe(
    path.join(projectRoot, 'data', 'cad', 'sample_bracket.stl'),
    path.join(dataTargetDir, 'cad', 'sample_bracket.stl')
  );
  copyFileSafe(
    path.join(projectRoot, 'data', 'ansys', 'synthetic_temperature_point_cloud.csv'),
    path.join(dataTargetDir, 'ansys', 'synthetic_temperature_point_cloud.csv')
  );
  log('Staged sample_bracket.stl and synthetic_temperature_point_cloud.csv into resources/data/');

  // Step 7: Bundle complete submission materials into distribution root
  log('Bundling project source code, documentation, tests, and configuration into release folder...');
  copyFileSafe(path.join(projectRoot, 'README.md'), path.join(distDir, 'README.md'));
  copyFileSafe(path.join(projectRoot, 'CMakeLists.txt'), path.join(distDir, 'CMakeLists.txt'));
  copyFileSafe(path.join(projectRoot, 'package.json'), path.join(distDir, 'package.json'));
  copyFileSafe(path.join(projectRoot, 'package-lock.json'), path.join(distDir, 'package-lock.json'));

  const excludeBuilds = new Set(['node_modules', '.git', 'build', 'dist', 'release', '.vite']);
  copyDirRecursive(path.join(projectRoot, '.vscode'), path.join(distDir, '.vscode'));
  copyDirRecursive(path.join(projectRoot, 'src'), path.join(distDir, 'src'), { excludeNames: excludeBuilds });
  copyDirRecursive(path.join(projectRoot, 'frontend'), path.join(distDir, 'frontend'), { excludeNames: excludeBuilds });
  copyDirRecursive(path.join(projectRoot, 'electron'), path.join(distDir, 'electron'), { excludeNames: excludeBuilds });
  copyDirRecursive(path.join(projectRoot, 'tests'), path.join(distDir, 'tests'), { excludeNames: excludeBuilds });
  copyDirRecursive(path.join(projectRoot, 'data'), path.join(distDir, 'data'), { excludeNames: excludeBuilds });
  copyDirRecursive(path.join(projectRoot, 'docs'), path.join(distDir, 'docs'), { excludeNames: excludeBuilds });

  // Export verifiable git commit history log into docs/GIT_LOG.txt
  try {
    const gitLog = cp.execFileSync('git', ['log', '--graph', '--oneline', '--decorate', '--all'], {
      cwd: projectRoot,
      encoding: 'utf8'
    });
    fs.writeFileSync(path.join(distDir, 'docs', 'GIT_LOG.txt'), gitLog, 'utf8');
    log('Exported verifiable Git commit history to docs/GIT_LOG.txt.');
  } catch (err) {
    log(`Note: git log export skipped (${err.message}).`);
  }

  // Step 8: Create CandidateID_Workbench.zip submission archive
  log(`Compressing distribution package into: ${zipPath}`);
  let zipCreated = false;

  // Primary archiver: C:\Windows\System32\tar.exe (Fast, native Windows 10/11 utility)
  try {
    cp.execFileSync('tar.exe', ['-a', '-cf', zipPath, '-C', distDir, '.'], {
      stdio: ['ignore', 'inherit', 'inherit']
    });
    if (fs.existsSync(zipPath) && fs.statSync(zipPath).size > 0) {
      zipCreated = true;
      log('Created ZIP archive using Windows native tar.exe.');
    }
  } catch (err) {
    log(`tar.exe packaging failed (${err.message}); falling back to PowerShell Compress-Archive...`);
  }

  // Fallback archiver: PowerShell Compress-Archive
  if (!zipCreated) {
    const psCmd = `Compress-Archive -Path "${distDir}\\*" -DestinationPath "${zipPath}" -Force`;
    cp.execFileSync('powershell.exe', ['-NoProfile', '-Command', psCmd], {
      stdio: ['ignore', 'inherit', 'inherit']
    });
    if (fs.existsSync(zipPath) && fs.statSync(zipPath).size > 0) {
      zipCreated = true;
      log('Created ZIP archive using PowerShell Compress-Archive.');
    } else {
      errorLog('Failed to generate ZIP archive!');
      process.exit(1);
    }
  }

  // Step 9: Compute cryptographic checksum (SHA256)
  log('Computing SHA256 cryptographic checksum...');
  const zipSha256 = calculateFileSha256(zipPath);
  const zipSizeMb = (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2);
  const shaContent = `${zipSha256} *${path.basename(zipPath)}\n`;
  fs.writeFileSync(shaPath, shaContent, 'utf8');
  log(`Checksum written to: ${shaPath}`);

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // Step 10: Print Verification Summary
  console.log('===============================================================');
  console.log('            STANDALONE PACKAGING SUMMARY REPORT                ');
  console.log('===============================================================');
  console.log(`Target Distribution Folder: ${distDir}`);
  console.log(`Top-Level Executable:       ${launchExe} (verified)`);
  console.log(`Native C++ Backend:         ${path.join(backendTargetDir, 'uew_backend.exe')} (verified)`);
  console.log(`Bundled CRT Dependencies:   ${redistDlls.length} DLLs (msvcp140, vcruntime140, etc.)`);
  console.log(`Packaged UI Application:    ${path.join(appDir, 'dist', 'renderer', 'index.html')} (verified)`);
  console.log(`Bundled Datasets:           CAD STL & ANSYS synthetic CSV (verified)`);
  console.log(`Submission Archive:         ${zipPath} (${zipSizeMb} MB)`);
  console.log(`Archive SHA256 Checksum:    ${zipSha256}`);
  console.log(`Duration:                   ${elapsedSec} seconds`);
  console.log('===============================================================');
  console.log('[SUCCESS] Standalone Windows 11 x64 package is ready for delivery.');
}

runPackaging().catch((err) => {
  errorLog(`Packaging unhandled failure: ${err.message}`);
  process.exit(1);
});
