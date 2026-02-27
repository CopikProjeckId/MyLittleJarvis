// JARVIS Command Sanitizer
// Prevents shell injection attacks by validating and sanitizing commands

export class CommandSanitizer {
  // Allowed commands whitelist
  static ALLOWED_COMMANDS = new Set([
    // File operations
    'ls', 'dir', 'cat', 'head', 'tail', 'find', 'grep', 'wc', 'file',
    // Git
    'git',
    // Node/NPM
    'node', 'npm', 'npx', 'yarn', 'pnpm', 'bun',
    // Python
    'python', 'python3', 'pip', 'pip3',
    // System info
    'echo', 'pwd', 'whoami', 'date', 'which', 'env', 'printenv',
    // Process
    'ps', 'top', 'htop',
    // Network (read-only)
    'curl', 'wget', 'ping', 'host', 'dig',
    // Docker (read-only)
    'docker',
    // Ollama
    'ollama'
  ]);

  // Dangerous patterns that should never be allowed
  static DANGEROUS_PATTERNS = [
    /[;&|`$]/,           // Command chaining and substitution
    /\.\.\//,            // Directory traversal
    />\s*\//,            // Redirect to root
    /rm\s+(-rf?|--)/,    // Dangerous rm flags
    /mkfs/,              // Filesystem format
    /dd\s+/,             // Disk operations
    />\s*\/dev/,         // Write to devices
    /chmod\s+777/,       // Dangerous permissions
    /sudo/,              // Privilege escalation
    /su\s+/,             // User switching
    /eval\s*\(/,         // Eval execution
    /exec\s*\(/,         // Exec execution
    /\$\(/,              // Command substitution
    /`/,                 // Backtick substitution
  ];

  // Blocked subcommands for specific commands
  static BLOCKED_SUBCOMMANDS = {
    git: ['push', 'force-push', 'reset --hard'],
    docker: ['rm', 'rmi', 'system prune', 'volume rm'],
    npm: ['publish'],
  };

  /**
   * Sanitize and validate a command
   * @param {string} command - The command string to sanitize
   * @returns {{ cmd: string, args: string[] }} - Parsed command and arguments
   * @throws {Error} - If command is not allowed
   */
  static sanitize(command) {
    if (!command || typeof command !== 'string') {
      throw new Error('Invalid command: must be a non-empty string');
    }

    const trimmed = command.trim();

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(trimmed)) {
        throw new Error(`Dangerous pattern detected in command: ${trimmed.substring(0, 50)}`);
      }
    }

    // Parse command and arguments
    const parts = this.parseCommand(trimmed);
    if (parts.length === 0) {
      throw new Error('Empty command');
    }

    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Check if command is in whitelist
    if (!this.ALLOWED_COMMANDS.has(cmd)) {
      throw new Error(`Command not allowed: ${cmd}. Allowed commands: ${[...this.ALLOWED_COMMANDS].join(', ')}`);
    }

    // Check for blocked subcommands
    const blockedSubs = this.BLOCKED_SUBCOMMANDS[cmd];
    if (blockedSubs) {
      const fullCmd = parts.join(' ').toLowerCase();
      for (const blocked of blockedSubs) {
        if (fullCmd.includes(blocked)) {
          throw new Error(`Subcommand not allowed: ${blocked}`);
        }
      }
    }

    // Additional validation for specific commands
    this.validateSpecificCommand(cmd, args);

    return { cmd: parts[0], args };
  }

  /**
   * Parse command string into parts, respecting quotes
   * @param {string} command
   * @returns {string[]}
   */
  static parseCommand(command) {
    const parts = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < command.length; i++) {
      const char = command[i];

      if ((char === '"' || char === "'") && !inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuote) {
        inQuote = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuote) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }

  /**
   * Additional validation for specific commands
   * @param {string} cmd
   * @param {string[]} args
   */
  static validateSpecificCommand(cmd, args) {
    switch (cmd) {
      case 'curl':
      case 'wget':
        // Ensure not posting to suspicious URLs
        const urlArg = args.find(a => a.startsWith('http'));
        if (urlArg) {
          const suspicious = ['evil', 'malware', 'hack', 'exploit'];
          if (suspicious.some(s => urlArg.toLowerCase().includes(s))) {
            throw new Error('Suspicious URL detected');
          }
        }
        break;

      case 'docker':
        // Only allow safe docker commands
        const safeDockerCmds = ['ps', 'images', 'logs', 'inspect', 'stats', 'version', 'info'];
        if (args.length > 0 && !safeDockerCmds.includes(args[0])) {
          throw new Error(`Docker subcommand not allowed: ${args[0]}`);
        }
        break;

      case 'git':
        // Block destructive git operations
        const blockedGit = ['push', 'reset', 'clean', 'checkout --'];
        if (blockedGit.some(b => args.join(' ').includes(b))) {
          throw new Error('Destructive git operation not allowed');
        }
        break;
    }
  }

  /**
   * Check if a command would be allowed (without throwing)
   * @param {string} command
   * @returns {{ allowed: boolean, reason?: string }}
   */
  static check(command) {
    try {
      this.sanitize(command);
      return { allowed: true };
    } catch (error) {
      return { allowed: false, reason: error.message };
    }
  }
}

export default CommandSanitizer;
