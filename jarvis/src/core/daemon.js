// JARVIS Daemon Manager
// Manages background service lifecycle: start, stop, status

import { spawn } from 'child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = join(__dirname, '..', '..');  // jarvis/ package root

export class DaemonManager {
  constructor() {
    this.jarvisDir = join(homedir(), '.jarvis');
    this.pidFile = join(this.jarvisDir, 'jarvis.pid');
    this.logFile = join(this.jarvisDir, 'jarvis.log');
    this.serviceScript = join(PKG_ROOT, 'service.js');
  }

  /**
   * Check if service is running
   */
  isRunning() {
    const pid = this.getPid();
    if (!pid) return false;

    try {
      // Send signal 0 to check if process exists
      process.kill(pid, 0);
      return true;
    } catch {
      // Process doesn't exist, clean up stale PID file
      this.cleanPidFile();
      return false;
    }
  }

  /**
   * Get service PID
   */
  getPid() {
    if (!existsSync(this.pidFile)) return null;
    try {
      const pid = parseInt(readFileSync(this.pidFile, 'utf-8').trim());
      return isNaN(pid) ? null : pid;
    } catch {
      return null;
    }
  }

  /**
   * Start the service as a detached background process
   */
  async start() {
    if (this.isRunning()) {
      const pid = this.getPid();
      return { success: false, error: `Service already running (PID: ${pid})`, pid };
    }

    // Ensure .jarvis directory
    if (!existsSync(this.jarvisDir)) {
      mkdirSync(this.jarvisDir, { recursive: true });
    }

    // Open log file for stdout/stderr
    const { openSync } = await import('fs');
    const logFd = openSync(this.logFile, 'a');

    // Spawn detached child process
    const child = spawn(process.execPath, [this.serviceScript], {
      detached: true,
      stdio: ['ignore', logFd, logFd],
      cwd: PKG_ROOT,
      env: { ...process.env }
    });

    // Unref so parent can exit
    child.unref();

    const pid = child.pid;

    // Wait briefly to verify the process started
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (this.isRunning()) {
      return { success: true, pid, logFile: this.logFile };
    } else {
      return { success: false, error: 'Service failed to start. Check logs.', logFile: this.logFile };
    }
  }

  /**
   * Stop the running service
   */
  async stop() {
    const pid = this.getPid();
    if (!pid || !this.isRunning()) {
      this.cleanPidFile();
      return { success: false, error: 'Service is not running' };
    }

    try {
      // Send SIGTERM for graceful shutdown
      process.kill(pid, 'SIGTERM');

      // Wait for process to exit (max 5 seconds)
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!this.isRunning()) {
          this.cleanPidFile();
          return { success: true, pid };
        }
      }

      // Force kill if still running
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}

      this.cleanPidFile();
      return { success: true, pid, forced: true };
    } catch (error) {
      this.cleanPidFile();
      return { success: false, error: error.message };
    }
  }

  /**
   * Get service status
   */
  async status() {
    const running = this.isRunning();
    const pid = this.getPid();

    const result = {
      running,
      pid: running ? pid : null
    };

    if (running) {
      // Try to check gateway health
      try {
        const configPath = join(this.jarvisDir, 'jarvis.json');
        let port = 18789;
        if (existsSync(configPath)) {
          const cfg = JSON.parse(readFileSync(configPath, 'utf-8'));
          port = cfg.gateway?.port || 18789;
        }

        const response = await fetch(`http://127.0.0.1:${port}/health`, {
          signal: AbortSignal.timeout(2000)
        });

        if (response.ok) {
          const health = await response.json();
          result.gateway = { port, status: 'ok', uptime: health.uptime };
        } else {
          result.gateway = { port, status: 'error' };
        }
      } catch {
        result.gateway = { status: 'unreachable' };
      }
    }

    return result;
  }

  /**
   * Get recent logs
   */
  getLogs(lines = 20) {
    if (!existsSync(this.logFile)) return [];
    try {
      const content = readFileSync(this.logFile, 'utf-8');
      const allLines = content.split('\n').filter(l => l.trim());
      return allLines.slice(-lines);
    } catch {
      return [];
    }
  }

  /**
   * Clean up stale PID file
   */
  cleanPidFile() {
    try {
      if (existsSync(this.pidFile)) unlinkSync(this.pidFile);
    } catch {}
  }
}
