import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { setupSecurityPolicies, validateIpcSender } from './security';
import { BackendManager } from './backend-manager';

let mainWindow: BrowserWindow | null = null;
const backendManager = new BackendManager();
const isDev = process.env.NODE_ENV === 'development';

async function createWindow(): Promise<BrowserWindow> {
  // 1. Initialize C++ backend lifecycle and determine loopback port BEFORE loading window
  await backendManager.start();

  // 2. Create the sandboxed browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, '../preload/index.js')
    }
  });

  // 3. Apply strict CSP with dynamic loopback port resolution
  setupSecurityPolicies(mainWindow, {
    isDev,
    getBackendPort: () => backendManager.getStatus().port
  });

  // Forward renderer console logs and errors for test verification
  mainWindow.webContents.on('console-message', (details) => {
    console.log(`[RENDERER ${details.level}] ${details.message}`);
  });
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[RENDERER ERROR] Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
  });

  // 4. Load application URL/file
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (isDev && devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    console.log('[ELECTRON] Window ready-to-show successfully.');

    // Automated verification support: close after verification window
    if (process.env.TEST_AUTOCLOSE) {
      const delay = parseInt(process.env.TEST_AUTOCLOSE, 10) || 3000;
      setTimeout(() => {
        console.log('[ELECTRON] Test auto-close delay elapsed; closing window.');
        mainWindow?.close();
      }, delay);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// IPC Handlers with sender frame validation
ipcMain.handle('backend:get-status', (event) => {
  if (mainWindow && !validateIpcSender(mainWindow.webContents, event.senderFrame)) {
    throw new Error('Unauthorized IPC sender frame');
  }
  return backendManager.getStatus();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  await backendManager.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await backendManager.stop();
});
