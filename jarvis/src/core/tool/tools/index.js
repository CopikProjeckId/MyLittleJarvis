// JARVIS Tool Registry
// Central registry for all tools
// OpenClaw-level tool ecosystem (50+ tools)

import { fileTools } from './file.js';
import { bashTools } from './bash.js';
import { gitTools } from './git.js';
import { browserTools } from './browser.js';
import { mediaTools } from './media.js';
import { utilityTools } from './utility.js';
import { searchTools } from './search.js';
import { contextTools } from './context.js';
import { nmtTools } from './nmt.js';  // NMT integration - Neuron Merkle Tree

// ============================================================
// Tool Registry
// ============================================================

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.categories = new Map();
  }

  /**
   * Register a single tool
   */
  register(tool) {
    if (!tool.name || !tool.handler) {
      throw new Error('Tool must have name and handler');
    }

    this.tools.set(tool.name, {
      name: tool.name,
      description: tool.description || '',
      parameters: tool.parameters || { type: 'object', properties: {} },
      handler: tool.handler,
      timeout: tool.timeout || 60000,
      retry: tool.retry || 0,
      category: tool.category || 'general'
    });

    // Track by category
    const category = tool.category || 'general';
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(tool.name);

    return this;
  }

  /**
   * Register multiple tools from an object
   */
  registerAll(toolsObj) {
    for (const [name, tool] of Object.entries(toolsObj)) {
      this.register({ ...tool, name: tool.name || name });
    }
    return this;
  }

  /**
   * Get a tool by name
   */
  get(name) {
    return this.tools.get(name);
  }

  /**
   * Check if tool exists
   */
  has(name) {
    return this.tools.has(name);
  }

  /**
   * List all tools
   */
  list(category = null) {
    const tools = Array.from(this.tools.values());

    if (category) {
      return tools.filter(t => t.category === category);
    }

    return tools.map(t => ({
      name: t.name,
      description: t.description,
      category: t.category,
      parameters: t.parameters
    }));
  }

  /**
   * List categories
   */
  listCategories() {
    return Array.from(this.categories.entries()).map(([name, tools]) => ({
      name,
      count: tools.length,
      tools
    }));
  }

  /**
   * Execute a tool
   */
  async execute(name, params = {}, context = {}) {
    const tool = this.tools.get(name);

    if (!tool) {
      return { error: `Tool not found: ${name}` };
    }

    try {
      const result = await Promise.race([
        tool.handler(params, context),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), tool.timeout)
        )
      ]);

      return result;
    } catch (error) {
      return { error: error.message, tool: name };
    }
  }

  /**
   * Get tool count
   */
  get size() {
    return this.tools.size;
  }
}

// ============================================================
// Default Registry with all tools
// ============================================================

export const registry = new ToolRegistry();

// Register file tools
registry.registerAll(
  Object.fromEntries(
    Object.entries(fileTools).map(([name, tool]) => [
      name,
      { ...tool, category: 'file' }
    ])
  )
);

// Register bash tools
registry.registerAll(
  Object.fromEntries(
    Object.entries(bashTools).map(([name, tool]) => [
      name,
      { ...tool, category: 'code' }
    ])
  )
);

// Register git tools
registry.registerAll(
  Object.fromEntries(
    Object.entries(gitTools).map(([name, tool]) => [
      name,
      { ...tool, category: 'git' }
    ])
  )
);

// Register browser automation tools
registry.registerAll(
  Object.fromEntries(
    Object.entries(browserTools).map(([name, tool]) => [
      name,
      {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        handler: tool.execute,
        category: 'browser'
      }
    ])
  )
);

// Register media processing tools
registry.registerAll(
  Object.fromEntries(
    Object.entries(mediaTools).map(([name, tool]) => [
      name,
      {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        handler: tool.execute,
        category: 'media'
      }
    ])
  )
);

// Register utility tools
registry.registerAll(
  Object.fromEntries(
    Object.entries(utilityTools).map(([name, tool]) => [
      name,
      { ...tool, category: 'utility' }
    ])
  )
);

// Register search tools
registry.registerAll(
  Object.fromEntries(
    Object.entries(searchTools).map(([name, tool]) => [
      name,
      { ...tool, category: 'search' }
    ])
  )
);

// Register context/memory tools
registry.registerAll(
  Object.fromEntries(
    Object.entries(contextTools).map(([name, tool]) => [
      name,
      { ...tool, category: 'context' }
    ])
  )
);

// Register NMT tools (knowledge graph) - Neuron Merkle Tree
// Includes: Core + Probabilistic Ontology + Autonomous Recursive Learning
registry.registerAll(
  Object.fromEntries(
    Object.entries(nmtTools).map(([name, tool]) => [
      name,
      { ...tool, category: 'memory' }
    ])
  )
);

// ============================================================
// Export combined tools object
// ============================================================

export const allTools = {
  ...fileTools,
  ...bashTools,
  ...gitTools,
  ...browserTools,
  ...mediaTools,
  ...utilityTools,
  ...searchTools,
  ...contextTools,
  ...nmtTools,  // NMT integration - Neuron Merkle Tree
};

export const toolImplementations = Object.fromEntries(
  Object.entries(allTools).map(([name, tool]) => [name, tool.handler])
);

export default registry;
