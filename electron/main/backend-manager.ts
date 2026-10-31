import { ChildProcess, spawn, exec } from 'child_process';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import http from 'http';

export interface BackendProcessInfo {
  online: boolean;
  port: number | null;
  pid: number | null;
  error?: string;
}

/**
 * Manages the lifecycle of the C++ backend process.
 * Security design:
 * 1. The session authentication token is NEVER passed via command-line arguments.
 * 2. The token is transmitted exclusively over child process anonymous stdin pipe during startup handshake.
 * 3. The token is held exclusively in this module and never exposed to the renderer or logged.
 * 4. Dynamic loopback port assignment (port 0) eliminates port race conditions.
 */
export class BackendManager {
  private process: ChildProcess | null = null;
  private readonly authToken: string;
  private port: number | null = null;
  private isOnline: boolean = false;

  constructor() {
    // 32-byte cryptographically secure random token generated exclusively for this session.
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
    const candidates = [
      path.resolve(__dirname, '../../../build/Release/uew_backend.exe'),
      path.resolve(process.cwd(), 'build/Release/uew_backend.exe'),
      path.resolve(process.resourcesPath ?? '', 'backend', 'uew_backend.exe')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return candidates[0];
  }

  /**
   * Starts the C++ backend child process using dynamic port allocation and secure stdin token handshake.
   */
  public async start(requestedPort: number = 0): Promise<BackendProcessInfo> {
    const binaryPath = this.getBinaryPath();
    if (!fs.existsSync(binaryPath)) {
      console.warn(`[BACKEND MANAGER] Binary not found at ${binaryPath}. Running in offline mock mode.`);
      this.port = null;
      this.isOnline = false;
      return this.getStatus();
    }

    return new Promise((resolve) => {
      console.log(`[BACKEND MANAGER] Spawning backend from: ${binaryPath}`);
      // Security: Only pass --port. Token is NEVER passed in command-line arguments.
      const args = ['--port', requestedPort.toString()];
      const proc = spawn(binaryPath, args, {
        stdio: ['pipe', 'pipe', 'inherit']
      });

      this.process = proc;
      let resolved = false;
      let tokenHandshakeComplete = false;

      proc.stdout?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        process.stdout.write(text);

        // Step 1: Detect bound port message: [BACKEND READY] port=<PORT> pid=<PID>
        const readyMatch = text.match(/\[BACKEND READY\] port=(\d+) pid=(\d+)/);
        if (readyMatch) {
          const boundPort = parseInt(readyMatch[1], 10);
          if (boundPort > 0 && boundPort <= 65535) {
            this.port = boundPort;
            console.log(`[BACKEND MANAGER] Backend bound to dynamic loopback port: ${this.port}`);

            // Step 2: Transmit session token securely via stdin pipe
            try {
              if (proc.stdin && proc.stdin.writable) {
                proc.stdin.write(`INIT_TOKEN ${this.authToken}\n`);
              }
            } catch (err: any) {
              console.error(`[BACKEND MANAGER] Failed to write token to stdin: ${err.message}`);
            }
          }
        }

        // Step 3: Detect token initialization confirmation: [TOKEN READY]
        if (text.includes('[TOKEN READY]') && !tokenHandshakeComplete) {
          tokenHandshakeComplete = true;
          console.log('[BACKEND MANAGER] Token handshake confirmed by backend. Performing health check...');

          if (this.port) {
            this.verifyHealth(this.port)
              .then((healthy) => {
                this.isOnline = healthy;
                if (!healthy) {
                  console.error('[BACKEND MANAGER] Health verification returned unhealthy status. Cleaning up process.');
                  this.stop().finally(() => {
                    if (!resolved) {
                      resolved = true;
                      resolve(this.getStatus());
                    }
                  });
                  return;
                }
                if (!resolved) {
                  resolved = true;
                  resolve(this.getStatus());
                }
              })
              .catch((err) => {
                console.error(`[BACKEND MANAGER] Health verification error: ${err.message}`);
                this.isOnline = false;
                this.stop().finally(() => {
                  if (!resolved) {
                    resolved = true;
                    resolve(this.getStatus());
                  }
                });
              });
          }
        }
      });

      proc.on('error', (err) => {
        console.error(`[BACKEND MANAGER] Process error: ${err.message}`);
        this.isOnline = false;
        if (!resolved) {
          resolved = true;
          resolve(this.getStatus());
        }
      });

      proc.on('exit', (code, signal) => {
        console.log(`[BACKEND MANAGER] Process exited with code ${code}, signal ${signal}`);
        this.isOnline = false;
        this.process = null;
        if (!resolved) {
          resolved = true;
          resolve(this.getStatus());
        }
      });

      // Watchdog timeout: 5000ms maximum startup allowance
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.error('[BACKEND MANAGER] Startup handshake timed out after 5000ms.');
          this.stop().finally(() => {
            resolve(this.getStatus());
          });
        }
      }, 5000);
    });
  }

  private verifyHealth(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/v1/health',
          method: 'GET',
          headers: {
            'X-Session-Token': this.authToken
          },
          timeout: 2000
        },
        (res) => {
          if (res.statusCode === 200) {
            let data = '';
            res.on('data', (d) => (data += d));
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                console.log(`[BACKEND MANAGER] Health check verified: status=${parsed.status}, core_ready=${parsed.core_ready}`);
                resolve(true);
              } catch {
                resolve(false);
              }
            });
          } else {
            console.error(`[BACKEND MANAGER] Health check returned HTTP ${res.statusCode}`);
            resolve(false);
          }
        }
      );

      req.on('error', (err) => {
        console.error(`[BACKEND MANAGER] Health check network error: ${err.message}`);
        resolve(false);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  }

  /**
   * Gracefully terminates the C++ backend child process with Windows-aware process tree cleanup.
   * Protocol: Writes 'SHUTDOWN\n' over stdin, waits up to 2000ms, then enforces taskkill watchdog.
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
      try {
        if (this.process.stdin && this.process.stdin.writable) {
          this.process.stdin.write('SHUTDOWN\n');
        }
      } catch {
        // Ignore stdin errors if process already exited
      }

      // 2. Wait up to 2000ms for graceful exit, then forceful tree-kill via taskkill watchdog
      await new Promise<void>((resolve) => {
        let finished = false;
        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            // Forcefully terminate process and all child processes (/T /F)
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
    this.port = null;
  }
}
