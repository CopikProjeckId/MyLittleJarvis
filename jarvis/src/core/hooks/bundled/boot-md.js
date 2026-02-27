// JARVIS Boot Markdown Hook
// Loads system prompt and context from CLAUDE.md / JARVIS.md files
// Based on OpenClaw's boot-md handler

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { HOOK_PRIORITY } from '../types.js';

// Files to check for boot markdown
const BOOT_FILES = [
  'JARVIS.md',
  'CLAUDE.md',
  '.jarvis/SYSTEM.md',
  '.claude/SYSTEM.md',
  'README.md' // Fallback
];

// Frontmatter parser (simple YAML-like)
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: match[2] };
}

/**
 * Find boot markdown file
 * @param {string} [cwd] - Working directory
 */
export function findBootFile(cwd = process.cwd()) {
  // Search current directory and parent directories
  let dir = cwd;
  const searched = [];

  for (let i = 0; i < 5; i++) { // Max 5 levels up
    for (const file of BOOT_FILES) {
      const filePath = join(dir, file);
      searched.push(filePath);
      if (existsSync(filePath)) {
        return filePath;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

/**
 * Load boot markdown content
 * @param {string} filePath
 */
export function loadBootMarkdown(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    return {
      path: filePath,
      frontmatter,
      content: body.trim(),
      raw: content
    };
  } catch {
    return null;
  }
}

/**
 * Boot Markdown Hook
 * Loads system context from markdown files on session start
 */
export const bootMdHook = {
  id: 'boot-md',
  name: 'Boot Markdown',
  description: 'Loads system prompt from JARVIS.md/CLAUDE.md files',
  events: ['boot', 'session-start'],
  priority: HOOK_PRIORITY.CRITICAL, // Run first
  enabled: true,

  async handler({ event, context, data }) {
    const cwd = context.cwd || process.cwd();
    const bootFile = findBootFile(cwd);

    if (!bootFile) {
      return {
        continue: true,
        message: 'No boot markdown file found'
      };
    }

    const bootData = loadBootMarkdown(bootFile);
    if (!bootData) {
      return {
        continue: true,
        message: `Failed to load ${bootFile}`
      };
    }

    // Extract system prompt sections
    const sections = extractSections(bootData.content);

    return {
      continue: true,
      data: {
        ...data,
        bootMarkdown: {
          path: bootData.path,
          frontmatter: bootData.frontmatter,
          sections
        },
        systemPrompt: sections.system || bootData.content,
        projectContext: sections.context,
        guidelines: sections.guidelines
      },
      message: `Loaded boot markdown from ${bootFile}`
    };
  }
};

/**
 * Extract sections from markdown content
 */
function extractSections(content) {
  const sections = {};
  const lines = content.split('\n');
  let currentSection = 'default';
  let currentContent = [];

  for (const line of lines) {
    const headerMatch = line.match(/^#+\s+(.+)$/);
    if (headerMatch) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
      }
      currentSection = headerMatch[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection.toLowerCase()] = currentContent.join('\n').trim();
  }

  return sections;
}

/**
 * Generate system prompt from boot markdown
 * @param {Object} bootData
 */
export function generateSystemPrompt(bootData) {
  if (!bootData) return null;

  const parts = [];

  // Add system section
  if (bootData.sections?.system) {
    parts.push(bootData.sections.system);
  }

  // Add guidelines
  if (bootData.sections?.guidelines) {
    parts.push('\n## Guidelines\n' + bootData.sections.guidelines);
  }

  // Add project context
  if (bootData.sections?.context) {
    parts.push('\n## Project Context\n' + bootData.sections.context);
  }

  return parts.join('\n\n') || bootData.content;
}
