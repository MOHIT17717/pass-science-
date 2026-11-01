import { session, BrowserWindow, WebContents } from 'electron';

export interface SecurityOptions {
  isDev: boolean;
  getBackendPort: () => number | null;
}

export function setupSecurityPolicies(mainWindow: BrowserWindow, options: SecurityOptions): void {
  const { isDev, getBackendPort } = options;

  // 1. Enforce strict Content Security Policy (CSP) per request
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const backendPort = getBackendPort();
    let csp: string;

    if (isDev) {
      // Development CSP: permits Vite dev server, Fast Refresh inline preamble, and HMR WebSocket
      csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:5173",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        `connect-src 'self' ws://127.0.0.1:5173 http://127.0.0.1:5173 ${
          backendPort ? `http://127.0.0.1:${backendPort}` : ''
        }`.trim()
      ].join('; ');
    } else {
      // Production CSP: strictly locked down, no wildcards, no eval, explicit loopback port only
      const backendConnect = backendPort ? ` http://127.0.0.1:${backendPort}` : '';
      csp = [
        "default-src 'none'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        `connect-src 'self'${backendConnect}`
      ].join('; ');
    }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY']
      }
    });
  });

  // 2. Deny opening secondary windows or popups
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // 3. Block unexpected navigation outside the application
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (isDev && parsedUrl.origin === 'http://127.0.0.1:5173') {
      return; // Allow Vite dev server reload during development
    }
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });
}

/**
 * Validates that an incoming IPC call originated exclusively from the main application frame.
 */
export function validateIpcSender(contents: WebContents, senderFrame: any): boolean {
  if (!contents || !contents.mainFrame || !senderFrame) {
    return false;
  }
  return senderFrame === contents.mainFrame;
}
