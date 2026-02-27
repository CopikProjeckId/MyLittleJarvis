// JARVIS Bash/Shell Tools
// Secure command execution with sandboxing

import { spawn, exec } from 'child_process';
import { platform } from 'os';
import { existsSync } from 'fs';

// ============================================================
// Command Security
// ============================================================

const ALLOWED_COMMANDS = new Set([
  // File operations (safe)
  'ls', 'dir', 'cat', 'head', 'tail', 'wc', 'find', 'grep', 'awk', 'sed',
  'pwd', 'which', 'whereis', 'file', 'stat', 'du', 'df',

  // Development tools
  'node', 'npm', 'npx', 'yarn', 'pnpm', 'bun',
  'python', 'python3', 'pip', 'pip3',
  'go', 'cargo', 'rustc',
  'java', 'javac', 'mvn', 'gradle',
  'make', 'cmake',

  // Git
  'git',

  // Network (read-only)
  'curl', 'wget', 'ping', 'nslookup', 'dig',

  // Docker (limited)
  'docker',

  // Build tools
  'tsc', 'esbuild', 'vite', 'webpack',
  'prettier', 'eslint', 'jest', 'vitest', 'mocha',

  // System info
  'uname', 'hostname', 'date', 'whoami', 'id', 'env', 'printenv',

  // Text processing
  'echo', 'printf', 'sort', 'uniq', 'cut', 'tr', 'diff', 'patch',

  // Archive
  'tar', 'gzip', 'gunzip', 'zip', 'unzip'
]);

const BLOCKED_PATTERNS = [
  // Dangerous commands
  /\brm\s+-rf\s+[\/~]/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bformat\s+[a-z]:/i,

  // Privilege escalation
  /\bsudo\b/i,
  /\bsu\s+-/i,
  /\bdoas\b/i,

  // Destructive git
  /\bgit\s+push\s+--force/i,
  /\bgit\s+reset\s+--hard/i,
  /\bgit\s+clean\s+-f/i,

  // Shell injection patterns
  /;\s*rm\b/i,
  /\|\s*rm\b/i,
  /`[^`]*rm\b/i,
  /\$\([^)]*rm\b/i,

  // Dangerous docker
  /\bdocker\s+rm\s+-f/i,
  /\bdocker\s+system\s+prune/i,
  /\bdocker\s+rmi\s+-f/i,

  // Sensitive file access
  /\/etc\/shadow/i,
  /\/etc\/passwd/i,
  /\.ssh\/id_/i,
  /\.gnupg\//i,
  /\.aws\/credentials/i
];

const BLOCKED_SUBCOMMANDS = {
  git: ['push --force', 'reset --hard', 'clean -fd', 'checkout .'],
  docker: ['rm -f', 'rmi -f', 'system prune -f'],
  npm: ['publish'],
  rm: ['-rf /', '-rf ~', '-rf $HOME']
};

function validateCommand(command) {
  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: `Blocked pattern detected: ${pattern.toString()}`
      };
    }
  }

  // Extract base command
  const parts = command.trim().split(/\s+/);
  const baseCommand = parts[0].toLowerCase();

  // Check if command is allowed
  if (!ALLOWED_COMMANDS.has(baseCommand)) {
    return {
      allowed: false,
      reason: `Command '${baseCommand}' not in allowed list. Allowed: ${Array.from(ALLOWED_COMMANDS).slice(0, 10).join(', ')}...`
    };
  }

  // Check for blocked subcommands
  const blockedSubs = BLOCKED_SUBCOMMANDS[baseCommand];
  if (blockedSubs) {
    for (const sub of blockedSubs) {
      if (command.toLowerCase().includes(sub)) {
        return {
          allowed: false,
          reason: `Blocked subcommand: ${baseCommand} ${sub}`
        };
      }
    }
  }

  return { allowed: true };
}

// ============================================================
// bash: Execute shell command
// ============================================================

export async function bash(params) {
  const {
    command,
    cwd,
    timeout = 120000,
    description
  } = params;

  if (!command) {
    return { error: 'Command is required' };
  }

  // Validate command
  const validation = validateCommand(command);
  if (!validation.allowed) {
    return {
      error: validation.reason,
      blocked: true,
      command
    };
  }

  const isWindows = platform() === 'win32';
  const shell = isWindows ? 'cmd.exe' : 'bash';
  const shellArg = isWindows ? '/c' : '-c';

  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;

    const proc = spawn(shell, [shellArg, command], {
      cwd: cwd || process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' },
      windowsHide: true,
      timeout
    });

    // Set up timeout
    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGTERM');
      setTimeout(() => proc.kill('SIGKILL'), 1000);
    }, timeout);

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      // Limit output size
      if (stdout.length > 500000) {
        stdout = stdout.substring(0, 500000) + '\n... (output truncated)';
        proc.kill();
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > 100000) {
        stderr = stderr.substring(0, 100000) + '\n... (stderr truncated)';
      }
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;

      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code: killed ? -1 : code,
        duration,
        timeout: killed,
        command: description || command.substring(0, 100)
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        error: err.message,
        command
      });
    });
  });
}

// ============================================================
// python: Execute Python code
// ============================================================

export async function pythonExec(params) {
  const { code, timeout = 30000 } = params;

  if (!code) {
    return { error: 'Code is required' };
  }

  // Check if Python is available
  const pythonCmd = platform() === 'win32' ? 'python' : 'python3';

  return new Promise((resolve) => {
    const proc = spawn(pythonCmd, ['-c', code], {
      timeout,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code,
        language: 'python'
      });
    });

    proc.on('error', (err) => {
      resolve({
        error: `Python execution failed: ${err.message}`,
        hint: 'Ensure Python is installed and in PATH'
      });
    });
  });
}

// ============================================================
// nodeExec: Execute Node.js code
// ============================================================

export async function nodeExec(params) {
  const { code, timeout = 30000 } = params;

  if (!code) {
    return { error: 'Code is required' };
  }

  return new Promise((resolve) => {
    const proc = spawn('node', ['-e', code], {
      timeout,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code,
        language: 'node'
      });
    });

    proc.on('error', (err) => {
      resolve({
        error: `Node.js execution failed: ${err.message}`
      });
    });
  });
}

// ============================================================
// Helper: Check if command exists
// ============================================================

export async function hasCommand(cmd) {
  const checkCmd = platform() === 'win32' ? `where ${cmd}` : `which ${cmd}`;

  return new Promise((resolve) => {
    exec(checkCmd, (error) => {
      resolve(!error);
    });
  });
}

// ============================================================
// Export all bash tools
// ============================================================

export const bashTools = {
  'bash': {
    name: 'bash',
    description: 'Execute shell command with security validation',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute' },
        cwd: { type: 'string', description: 'Working directory' },
        timeout: { type: 'number', description: 'Timeout in ms', default: 120000 },
        description: { type: 'string', description: 'Description of what this command does' }
      },
      required: ['command']
    },
    timeout: 120000,
    handler: bash
  },

  'python': {
    name: 'python',
    description: 'Execute Python code',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Python code to execute' },
        timeout: { type: 'number', description: 'Timeout in ms', default: 30000 }
      },
      required: ['code']
    },
    timeout: 30000,
    handler: pythonExec
  },

  'node-exec': {
    name: 'node-exec',
    description: 'Execute Node.js code',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Node.js code to execute' },
        timeout: { type: 'number', description: 'Timeout in ms', default: 30000 }
      },
      required: ['code']
    },
    timeout: 30000,
    handler: nodeExec
  }
};

export default bashTools;
