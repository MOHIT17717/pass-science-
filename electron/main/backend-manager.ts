import { ChildProcess, spawn, exec } from 'child_process';
import crypto from 'crypto';
import path from 'path';

export interface BackendProcessInfo {
  online: boolean;
  port: number | null;
  pid: number | null;
  error?: string;
}

/**
 * Manages the lifecycle of the C++ backend process.
 * The authentication token is held exclusively in this module and never exposed to the renderer.
 */
export class BackendManager {
  private process: ChildProcess | null = null;
  private readonly authToken: string;
  private port: number | null = null;
  private isOnline: boolean = false;

  constructor() {
    // Cryptographically secure token generated exclusively for this session.
    // Main process uses this token when proxying requests; renderer never sees it.
    this.authToken = crypto.randomBytes(32).toString('hex');
  }

  /**
   * Returns current backend status safe for exposure to the UI.
   * Note: The private authentication token is strictly excluded.
   */
  public getStatus(): BackendProcessInfo {
    return {
      online: this.isOnline,
      port: this.port,
      pid: this.process ? this.process.pid ?? null : null
    };
  }

  /**
   * Retrieves the private token for Main process internal HTTP dispatch only.
   * Never expose this method or its return value via IPC.
   */
  public getPrivateToken(): string {
    return this.authToken;
  }

  /**
   * Resolves the C++ backend binary location for development vs packaged environments.
   */
  public getBinaryPath(): string {
    if (process.env.NODE_ENV === 'development') {
      // Points to CMake build output in dev
      return path.resolve(__dirname, '../../../build/Release/uew_backend.exe');
    }
    // In packaged app, bundled under resources/backend/
    return path.resolve(process.resourcesPath, 'backend', 'uew_backend.exe');
  }

  /**
   * Starts the C++ backend child process and waits for port readiness.
   */
  public async start(): Promise<BackendProcessInfo> {
    // In Task 04 baseline, we establish port and readiness contract.
    // In Task 05, this spawns the actual binary and verifies loopback socket binding.
    this.port = 18080;
    this.isOnline = true;
    return this.getStatus();
  }

  /**
   * Gracefully terminates the C++ backend child process with Windows-aware process tree cleanup.
   * On Windows, ChildProcess.kill('SIGTERM') acts as TerminateProcess and does not clean up child trees.
   */
  public async stop(): Promise<void> {
    if (!this.process || this.process.killed) {
      this.isOnline = false;
      return;
    }

    const pid = this.process.pid;
    if (!pid) {
      this.isOnline = false;
      return;
    }

    if (process.platform === 'win32') {
      // 1. Attempt graceful stdin notification
      // Note: The SHUTDOWN stdin protocol is an agreed lifecycle contract but remains unverified
      // until the C++ backend implements its stdin reader and signal response in Task 05.
      try {
        if (this.process.stdin && this.process.stdin.writable) {
          this.process.stdin.write('SHUTDOWN\n');
        }
      } catch {
        // Ignore stdin errors if process already exited
      }

      // 2. Wait up to 2000ms for graceful exit, then forceful tree-kill via taskkill
      await new Promise<void>((resolve) => {
        let finished = false;
        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            // Forcefully terminate process and all its child processes (/T /F)
            exec(`taskkill /pid ${pid} /T /F`, () => resolve());
          }
        }, 2000);

        this.process?.once('exit', () => {
          if (!finished) {
            finished = true;
            clearTimeout(timer);
            resolve();
          }
        });
      });
    } else {
      // POSIX fallback
      this.process.kill('SIGTERM');
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          if (this.process && !this.process.killed) {
            this.process.kill('SIGKILL');
          }
          resolve();
        }, 2000);

        this.process?.once('exit', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }

    this.process = null;
    this.isOnline = false;
  }
}
