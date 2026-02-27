// JARVIS Git Tools
// Git operations: status, diff, log, commit, branch

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

// ============================================================
// Helper: Execute git command
// ============================================================

async function execGit(args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, {
      cwd,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.trim() || `Git command failed with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Git not found: ${err.message}`));
    });
  });
}

// Check if directory is a git repo
async function isGitRepo(dir) {
  try {
    await execGit(['rev-parse', '--git-dir'], dir);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// git-status: Show working tree status
// ============================================================

export async function gitStatus(params) {
  const { path: repoPath = '.' } = params || {};
  const cwd = resolve(repoPath);

  if (!await isGitRepo(cwd)) {
    return { error: 'Not a git repository', path: cwd };
  }

  try {
    // Get porcelain status
    const status = await execGit(['status', '--porcelain', '-b'], cwd);
    const lines = status.split('\n').filter(Boolean);

    // Parse branch info
    const branchLine = lines[0] || '';
    const branchMatch = branchLine.match(/^## (.+?)(?:\.\.\.(.+))?$/);
    const branch = branchMatch ? branchMatch[1] : 'unknown';
    const tracking = branchMatch ? branchMatch[2] : null;

    // Parse file statuses
    const files = {
      staged: [],
      unstaged: [],
      untracked: []
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const indexStatus = line[0];
      const workStatus = line[1];
      const filePath = line.substring(3);

      if (indexStatus === '?' && workStatus === '?') {
        files.untracked.push(filePath);
      } else {
        if (indexStatus !== ' ' && indexStatus !== '?') {
          files.staged.push({ status: indexStatus, path: filePath });
        }
        if (workStatus !== ' ' && workStatus !== '?') {
          files.unstaged.push({ status: workStatus, path: filePath });
        }
      }
    }

    // Get ahead/behind count
    let ahead = 0, behind = 0;
    if (tracking) {
      try {
        const counts = await execGit(['rev-list', '--left-right', '--count', `${tracking}...HEAD`], cwd);
        const [b, a] = counts.split('\t').map(Number);
        behind = b || 0;
        ahead = a || 0;
      } catch {
        // Ignore if no tracking
      }
    }

    return {
      branch,
      tracking,
      ahead,
      behind,
      files,
      clean: files.staged.length === 0 && files.unstaged.length === 0 && files.untracked.length === 0
    };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================
// git-diff: Show changes
// ============================================================

export async function gitDiff(params) {
  const {
    path: repoPath = '.',
    staged = false,
    file,
    context = 3
  } = params || {};

  const cwd = resolve(repoPath);

  if (!await isGitRepo(cwd)) {
    return { error: 'Not a git repository', path: cwd };
  }

  try {
    const args = ['diff', `--unified=${context}`];

    if (staged) {
      args.push('--cached');
    }

    if (file) {
      args.push('--', file);
    }

    const diff = await execGit(args, cwd);

    // Parse diff into structured format
    const files = [];
    const fileDiffs = diff.split(/^diff --git /m).filter(Boolean);

    for (const fileDiff of fileDiffs) {
      const lines = fileDiff.split('\n');
      const headerMatch = lines[0].match(/a\/(.+?) b\/(.+)/);

      if (headerMatch) {
        const fileName = headerMatch[2];
        const hunks = [];
        let currentHunk = null;

        for (const line of lines) {
          if (line.startsWith('@@')) {
            if (currentHunk) hunks.push(currentHunk);
            currentHunk = { header: line, changes: [] };
          } else if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
            currentHunk.changes.push(line);
          }
        }
        if (currentHunk) hunks.push(currentHunk);

        files.push({
          file: fileName,
          hunks,
          additions: fileDiff.split('\n').filter(l => l.startsWith('+')).length - 1,
          deletions: fileDiff.split('\n').filter(l => l.startsWith('-')).length - 1
        });
      }
    }

    return {
      staged,
      raw: diff.substring(0, 50000) + (diff.length > 50000 ? '\n... (truncated)' : ''),
      files,
      totalFiles: files.length,
      totalAdditions: files.reduce((sum, f) => sum + f.additions, 0),
      totalDeletions: files.reduce((sum, f) => sum + f.deletions, 0)
    };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================
// git-log: Show commit history
// ============================================================

export async function gitLog(params) {
  const {
    path: repoPath = '.',
    limit = 10,
    oneline = false,
    author,
    since,
    until,
    file
  } = params || {};

  const cwd = resolve(repoPath);

  if (!await isGitRepo(cwd)) {
    return { error: 'Not a git repository', path: cwd };
  }

  try {
    const args = ['log', `-${limit}`];

    if (oneline) {
      args.push('--oneline');
    } else {
      args.push('--format=%H%n%h%n%an%n%ae%n%at%n%s%n%b%n---COMMIT_END---');
    }

    if (author) args.push(`--author=${author}`);
    if (since) args.push(`--since=${since}`);
    if (until) args.push(`--until=${until}`);
    if (file) args.push('--', file);

    const output = await execGit(args, cwd);

    if (oneline) {
      const commits = output.split('\n').filter(Boolean).map(line => {
        const [hash, ...messageParts] = line.split(' ');
        return { hash, message: messageParts.join(' ') };
      });
      return { commits, count: commits.length };
    }

    // Parse detailed format
    const commits = [];
    const commitBlocks = output.split('---COMMIT_END---').filter(Boolean);

    for (const block of commitBlocks) {
      const lines = block.trim().split('\n');
      if (lines.length >= 6) {
        commits.push({
          hash: lines[0],
          shortHash: lines[1],
          author: lines[2],
          email: lines[3],
          timestamp: new Date(parseInt(lines[4]) * 1000).toISOString(),
          subject: lines[5],
          body: lines.slice(6).join('\n').trim()
        });
      }
    }

    return { commits, count: commits.length };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================
// git-commit: Create a commit
// ============================================================

export async function gitCommit(params) {
  const {
    path: repoPath = '.',
    message,
    files,
    all = false,
    amend = false
  } = params || {};

  if (!message && !amend) {
    return { error: 'Commit message is required' };
  }

  const cwd = resolve(repoPath);

  if (!await isGitRepo(cwd)) {
    return { error: 'Not a git repository', path: cwd };
  }

  try {
    // Stage files if specified
    if (files && files.length > 0) {
      await execGit(['add', ...files], cwd);
    } else if (all) {
      await execGit(['add', '-A'], cwd);
    }

    // Check if there are staged changes
    const status = await gitStatus({ path: repoPath });
    if (status.files?.staged.length === 0 && !amend) {
      return {
        error: 'No staged changes to commit',
        hint: 'Stage files with files parameter or use all: true'
      };
    }

    // Create commit
    const args = ['commit'];
    if (message) args.push('-m', message);
    if (amend) args.push('--amend');
    if (amend && !message) args.push('--no-edit');

    const output = await execGit(args, cwd);

    // Get commit info
    const hash = await execGit(['rev-parse', 'HEAD'], cwd);
    const shortHash = await execGit(['rev-parse', '--short', 'HEAD'], cwd);

    return {
      success: true,
      hash,
      shortHash,
      message: message || '(amended)',
      output
    };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================
// git-branch: List, create, delete branches
// ============================================================

export async function gitBranch(params) {
  const {
    path: repoPath = '.',
    action = 'list',
    name,
    remote = false
  } = params || {};

  const cwd = resolve(repoPath);

  if (!await isGitRepo(cwd)) {
    return { error: 'Not a git repository', path: cwd };
  }

  try {
    switch (action) {
      case 'list': {
        const args = ['branch', '--format=%(refname:short)|%(objectname:short)|%(upstream:short)|%(HEAD)'];
        if (remote) args.push('-r');

        const output = await execGit(args, cwd);
        const branches = output.split('\n').filter(Boolean).map(line => {
          const [name, hash, upstream, current] = line.split('|');
          return {
            name,
            hash,
            upstream: upstream || null,
            current: current === '*'
          };
        });

        const currentBranch = branches.find(b => b.current)?.name;
        return { branches, current: currentBranch, count: branches.length };
      }

      case 'create': {
        if (!name) return { error: 'Branch name is required' };
        await execGit(['branch', name], cwd);
        return { success: true, created: name };
      }

      case 'delete': {
        if (!name) return { error: 'Branch name is required' };
        await execGit(['branch', '-d', name], cwd);
        return { success: true, deleted: name };
      }

      case 'checkout': {
        if (!name) return { error: 'Branch name is required' };
        await execGit(['checkout', name], cwd);
        return { success: true, switched: name };
      }

      default:
        return { error: `Unknown action: ${action}` };
    }
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================
// git-stash: Stash operations
// ============================================================

export async function gitStash(params) {
  const {
    path: repoPath = '.',
    action = 'list',
    message
  } = params || {};

  const cwd = resolve(repoPath);

  if (!await isGitRepo(cwd)) {
    return { error: 'Not a git repository', path: cwd };
  }

  try {
    switch (action) {
      case 'list': {
        const output = await execGit(['stash', 'list'], cwd);
        const stashes = output.split('\n').filter(Boolean).map(line => {
          const match = line.match(/^(stash@\{\d+\}): (.+)$/);
          return match ? { ref: match[1], message: match[2] } : { raw: line };
        });
        return { stashes, count: stashes.length };
      }

      case 'push': {
        const args = ['stash', 'push'];
        if (message) args.push('-m', message);
        const output = await execGit(args, cwd);
        return { success: true, output };
      }

      case 'pop': {
        const output = await execGit(['stash', 'pop'], cwd);
        return { success: true, output };
      }

      case 'drop': {
        const output = await execGit(['stash', 'drop'], cwd);
        return { success: true, output };
      }

      default:
        return { error: `Unknown action: ${action}` };
    }
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================
// git-add: Stage files
// ============================================================

export async function gitAdd(params) {
  const { path: repoPath = '.', files, all = false } = params || {};

  const cwd = resolve(repoPath);

  if (!await isGitRepo(cwd)) {
    return { error: 'Not a git repository', path: cwd };
  }

  try {
    if (all) {
      await execGit(['add', '-A'], cwd);
      return { success: true, staged: 'all' };
    }

    if (!files || files.length === 0) {
      return { error: 'No files specified. Use files array or all: true' };
    }

    await execGit(['add', ...files], cwd);
    return { success: true, staged: files };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================
// git-reset: Unstage files
// ============================================================

export async function gitReset(params) {
  const { path: repoPath = '.', files, soft = true } = params || {};

  const cwd = resolve(repoPath);

  if (!await isGitRepo(cwd)) {
    return { error: 'Not a git repository', path: cwd };
  }

  try {
    if (files && files.length > 0) {
      await execGit(['reset', 'HEAD', '--', ...files], cwd);
      return { success: true, unstaged: files };
    }

    // Unstage all
    await execGit(['reset', 'HEAD'], cwd);
    return { success: true, unstaged: 'all' };
  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================
// Export all git tools
// ============================================================

export const gitTools = {
  'git-status': {
    name: 'git-status',
    description: 'Show git working tree status',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path', default: '.' }
      }
    },
    handler: gitStatus
  },

  'git-diff': {
    name: 'git-diff',
    description: 'Show changes between commits, working tree, etc.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path', default: '.' },
        staged: { type: 'boolean', description: 'Show staged changes', default: false },
        file: { type: 'string', description: 'Specific file to diff' },
        context: { type: 'number', description: 'Lines of context', default: 3 }
      }
    },
    handler: gitDiff
  },

  'git-log': {
    name: 'git-log',
    description: 'Show commit history',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path', default: '.' },
        limit: { type: 'number', description: 'Number of commits', default: 10 },
        oneline: { type: 'boolean', description: 'One line per commit', default: false },
        author: { type: 'string', description: 'Filter by author' },
        since: { type: 'string', description: 'Show commits after date' },
        file: { type: 'string', description: 'Show commits for file' }
      }
    },
    handler: gitLog
  },

  'git-commit': {
    name: 'git-commit',
    description: 'Create a new commit',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path', default: '.' },
        message: { type: 'string', description: 'Commit message' },
        files: { type: 'array', items: { type: 'string' }, description: 'Files to stage and commit' },
        all: { type: 'boolean', description: 'Stage all changes', default: false }
      },
      required: ['message']
    },
    handler: gitCommit
  },

  'git-branch': {
    name: 'git-branch',
    description: 'List, create, or delete branches',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path', default: '.' },
        action: { type: 'string', enum: ['list', 'create', 'delete', 'checkout'], default: 'list' },
        name: { type: 'string', description: 'Branch name (for create/delete/checkout)' },
        remote: { type: 'boolean', description: 'Include remote branches', default: false }
      }
    },
    handler: gitBranch
  },

  'git-stash': {
    name: 'git-stash',
    description: 'Stash changes in working directory',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path', default: '.' },
        action: { type: 'string', enum: ['list', 'push', 'pop', 'drop'], default: 'list' },
        message: { type: 'string', description: 'Stash message (for push)' }
      }
    },
    handler: gitStash
  },

  'git-add': {
    name: 'git-add',
    description: 'Stage files for commit',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path', default: '.' },
        files: { type: 'array', items: { type: 'string' }, description: 'Files to stage' },
        all: { type: 'boolean', description: 'Stage all changes', default: false }
      }
    },
    handler: gitAdd
  },

  'git-reset': {
    name: 'git-reset',
    description: 'Unstage files',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path', default: '.' },
        files: { type: 'array', items: { type: 'string' }, description: 'Files to unstage' }
      }
    },
    handler: gitReset
  }
};

export default gitTools;
