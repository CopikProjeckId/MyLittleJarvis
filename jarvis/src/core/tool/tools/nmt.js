// JARVIS NMT Tools (Enhanced)
// Complete integration with NMT (Neuron Merkle Tree) system
// Includes: Core + Probabilistic Ontology + Autonomous Recursive Learning

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { resolve, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { homedir } from 'os';

const execAsync = promisify(exec);

// ============================================================
// Configuration
// ============================================================

function getNmtConfig(options = {}) {
  return {
    nmtPath: process.env.NMT_PATH || options.nmtPath || resolve(process.cwd(), '../nmt-system'),
    dataDir: process.env.NMT_DATA_DIR || options.dataDir || './data',
    timeout: options.timeout || 60000,
    useGlobalCli: process.env.NMT_USE_GLOBAL === 'true' || options.useGlobalCli || true,
  };
}

const NMT_CONFIG = getNmtConfig();

// Learning state persistence
const LEARNING_STATE_PATH = join(homedir(), '.jarvis', 'nmt-learning-state.json');

// ============================================================
// Helper Functions
// ============================================================

async function nmtExec(args, options = {}) {
  const { timeout = NMT_CONFIG.timeout, json = true, cwd } = options;

  // Use global CLI if available (npx @ninebix/nmt-system)
  const useGlobal = NMT_CONFIG.useGlobalCli;
  const cmd = useGlobal
    ? `npx @ninebix/nmt-system ${args}${json ? ' --json' : ''}`
    : `npx tsx "${resolve(NMT_CONFIG.nmtPath, 'bin/nmt.ts')}" ${args}${json ? ' --json' : ''}`;

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: cwd || NMT_CONFIG.nmtPath,
      timeout,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (json && stdout.trim()) {
      try {
        return { success: true, data: JSON.parse(stdout) };
      } catch {
        return { success: true, data: stdout.trim() };
      }
    }

    return { success: true, data: stdout.trim(), stderr: stderr.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr,
    };
  }
}

async function checkNmtAvailable() {
  try {
    const result = await nmtExec('--version', { json: false });
    return result.success;
  } catch {
    return false;
  }
}

function loadLearningState() {
  try {
    if (existsSync(LEARNING_STATE_PATH)) {
      return JSON.parse(readFileSync(LEARNING_STATE_PATH, 'utf-8'));
    }
  } catch { }
  return {
    interactions: [],
    patterns: [],
    lastLearnTime: null,
    totalInteractions: 0,
    successRate: 0,
  };
}

function saveLearningState(state) {
  try {
    const dir = join(homedir(), '.jarvis');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(LEARNING_STATE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to save learning state:', error.message);
  }
}

// ============================================================
// Core NMT Tools
// ============================================================

export const nmtTools = {
  // -------------------- Search --------------------
  'nmt-search': {
    name: 'nmt-search',
    description: 'Semantic search across NMT knowledge graph using HNSW vector search',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query text' },
        topK: { type: 'number', description: 'Number of results (default: 5)', default: 5 },
        includeContent: { type: 'boolean', description: 'Include full content', default: false },
      },
      required: ['query'],
    },
    handler: async (params) => {
      const { query, topK = 5, includeContent = false } = params;

      if (!query) return { error: 'Query is required' };

      const args = `search "${query.replace(/"/g, '\\"')}" -k ${topK}${includeContent ? ' --content' : ''}`;
      const result = await nmtExec(args);

      if (!result.success) return { error: result.error };

      return {
        success: true,
        query,
        results: result.data.results || [],
        total: result.data.total || 0,
      };
    },
  },

  // -------------------- Ingest --------------------
  'nmt-ingest': {
    name: 'nmt-ingest',
    description: 'Ingest text into NMT knowledge graph with automatic embedding and indexing',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text content to ingest' },
        tags: { type: 'string', description: 'Comma-separated tags' },
        sourceType: { type: 'string', description: 'Source type (default: jarvis)', default: 'jarvis' },
      },
      required: ['text'],
    },
    handler: async (params) => {
      const { text, tags, sourceType = 'jarvis' } = params;

      if (!text) return { error: 'Text is required' };

      const escapedText = text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      let args = `ingest-text "${escapedText}" -s ${sourceType}`;

      if (tags) args += ` -t "${tags}"`;

      const result = await nmtExec(args);

      if (!result.success) return { error: result.error };

      return {
        success: true,
        neuronId: result.data.neuronId,
        merkleRoot: result.data.merkleRoot,
        chunks: result.data.chunks,
        tags: result.data.tags,
      };
    },
  },

  // -------------------- Get Neuron --------------------
  'nmt-get': {
    name: 'nmt-get',
    description: 'Get neuron details and content by ID',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Neuron ID' },
      },
      required: ['id'],
    },
    handler: async (params) => {
      const { id } = params;
      if (!id) return { error: 'Neuron ID is required' };

      const result = await nmtExec(`get ${id}`);
      if (!result.success) return { error: result.error };

      return { success: true, neuron: result.data };
    },
  },

  // -------------------- List Neurons --------------------
  'nmt-list': {
    name: 'nmt-list',
    description: 'List stored neurons in NMT',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number (default: 10)', default: 10 },
      },
    },
    handler: async (params) => {
      const { limit = 10 } = params;

      const result = await nmtExec(`list -k ${limit}`);
      if (!result.success) return { error: result.error };

      return {
        success: true,
        total: result.data.total,
        neurons: result.data.neurons || [],
      };
    },
  },

  // -------------------- Stats --------------------
  'nmt-stats': {
    name: 'nmt-stats',
    description: 'Get NMT system statistics',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const result = await nmtExec('stats');
      if (!result.success) return { error: result.error };

      return { success: true, stats: result.data };
    },
  },

  // -------------------- Verify --------------------
  'nmt-verify': {
    name: 'nmt-verify',
    description: 'Verify neuron integrity using Merkle proofs',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Neuron ID (all if not specified)' },
      },
    },
    handler: async (params) => {
      const { id } = params;

      const args = id ? `verify ${id}` : 'verify';
      const result = await nmtExec(args);

      if (!result.success) return { error: result.error };

      return { success: true, verification: result.data };
    },
  },

  // ============================================================
  // Probabilistic Ontology Tools (확률적 존재론)
  // ============================================================

  // -------------------- Bidirectional Inference --------------------
  'nmt-infer': {
    name: 'nmt-infer',
    description: 'Run bidirectional inference on neurons (forward/backward/causal/bidirectional)',
    parameters: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['forward', 'backward', 'causal', 'bidirectional'],
          description: 'Inference direction',
          default: 'forward',
        },
        neuronId: { type: 'string', description: 'Neuron ID to start from' },
        depth: { type: 'number', description: 'Inference depth (default: 3)', default: 3 },
      },
      required: ['neuronId'],
    },
    handler: async (params) => {
      const { neuronId, direction = 'forward', depth = 3 } = params;

      if (!neuronId) return { error: 'Neuron ID is required' };

      const args = `infer ${direction} ${neuronId} --depth ${depth}`;
      const result = await nmtExec(args);

      if (!result.success) return { error: result.error };

      return { success: true, inference: result.data };
    },
  },

  // -------------------- Attractor Management --------------------
  'nmt-attractor': {
    name: 'nmt-attractor',
    description: 'Manage future attractors for goal-oriented reasoning',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'list', 'influence', 'path', 'activate', 'deactivate'],
          description: 'Attractor action',
        },
        description: { type: 'string', description: 'Attractor description (for create)' },
        attractorId: { type: 'string', description: 'Attractor ID (for other actions)' },
        neuronId: { type: 'string', description: 'Neuron ID (for influence)' },
        strength: { type: 'number', description: 'Strength 0-1 (default: 0.8)', default: 0.8 },
      },
      required: ['action'],
    },
    handler: async (params) => {
      const { action, description, attractorId, neuronId, strength = 0.8 } = params;

      let args;
      switch (action) {
        case 'create':
          if (!description) return { error: 'Description required for create' };
          args = `attractor create "${description.replace(/"/g, '\\"')}" --strength ${strength}`;
          break;
        case 'list':
          args = 'attractor list';
          break;
        case 'influence':
          if (!attractorId || !neuronId) return { error: 'attractorId and neuronId required' };
          args = `attractor influence ${attractorId} ${neuronId}`;
          break;
        case 'path':
          if (!attractorId) return { error: 'attractorId required' };
          args = `attractor path ${attractorId}`;
          break;
        case 'activate':
          if (!attractorId) return { error: 'attractorId required' };
          args = `attractor activate ${attractorId}`;
          break;
        case 'deactivate':
          if (!attractorId) return { error: 'attractorId required' };
          args = `attractor deactivate ${attractorId}`;
          break;
        default:
          return { error: `Unknown action: ${action}` };
      }

      const result = await nmtExec(args);
      if (!result.success) return { error: result.error };

      return { success: true, action, result: result.data };
    },
  },

  // -------------------- 4-Stage Learning System --------------------
  'nmt-learn': {
    name: 'nmt-learn',
    description: '4-stage autonomous learning system (interaction/patterns/outcomes/stats)',
    parameters: {
      type: 'object',
      properties: {
        stage: {
          type: 'string',
          enum: ['interaction', 'patterns', 'outcomes', 'stats', 'auto'],
          description: 'Learning stage',
        },
        input: { type: 'string', description: 'Input data (for interaction)' },
        output: { type: 'string', description: 'Output data (for interaction)' },
        success: { type: 'boolean', description: 'Was interaction successful?' },
        context: { type: 'string', description: 'Additional context' },
      },
      required: ['stage'],
    },
    handler: async (params) => {
      const { stage, input, output, success, context } = params;

      let args;
      switch (stage) {
        case 'interaction':
          if (!input || !output) return { error: 'input and output required for interaction' };
          const interactionArgs = [
            'learn', 'interaction',
            `--input "${input.replace(/"/g, '\\"').substring(0, 2000)}"`,
            `--output "${output.replace(/"/g, '\\"').substring(0, 2000)}"`,
          ];
          if (success !== undefined) interactionArgs.push(`--success ${success}`);
          if (context) interactionArgs.push(`--context "${context.replace(/"/g, '\\"')}"`);
          args = interactionArgs.join(' ');
          break;
        case 'patterns':
          args = 'learn patterns';
          break;
        case 'outcomes':
          args = 'learn outcomes';
          break;
        case 'stats':
          args = 'learn stats';
          break;
        case 'auto':
          // Trigger full learning cycle
          args = 'learn patterns';
          break;
        default:
          return { error: `Unknown stage: ${stage}` };
      }

      const result = await nmtExec(args, { timeout: 120000 }); // Learning takes longer
      if (!result.success) return { error: result.error };

      return { success: true, stage, result: result.data };
    },
  },

  // -------------------- Dynamic Dimensions --------------------
  'nmt-dimension': {
    name: 'nmt-dimension',
    description: 'Manage dynamic embedding dimensions',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'expand', 'analyze', 'stats'],
          description: 'Dimension action',
        },
        name: { type: 'string', description: 'Dimension name (for expand)' },
        category: { type: 'string', description: 'Category (for expand)' },
      },
      required: ['action'],
    },
    handler: async (params) => {
      const { action, name, category } = params;

      let args;
      switch (action) {
        case 'list':
          args = 'dimension list';
          break;
        case 'expand':
          if (!name) return { error: 'Dimension name required for expand' };
          args = `dimension expand --name "${name}"`;
          if (category) args += ` --category "${category}"`;
          break;
        case 'analyze':
          args = 'dimension analyze';
          break;
        case 'stats':
          args = 'dimension stats';
          break;
        default:
          return { error: `Unknown action: ${action}` };
      }

      const result = await nmtExec(args);
      if (!result.success) return { error: result.error };

      return { success: true, action, result: result.data };
    },
  },

  // -------------------- Orchestration --------------------
  'nmt-orchestrate': {
    name: 'nmt-orchestrate',
    description: 'Orchestrate complex reasoning with all probabilistic modules',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['infer', 'goal', 'expand', 'stats'],
          description: 'Orchestration action',
        },
        query: { type: 'string', description: 'Query for inference' },
        goal: { type: 'string', description: 'Goal description' },
      },
      required: ['action'],
    },
    handler: async (params) => {
      const { action, query, goal } = params;

      let args;
      switch (action) {
        case 'infer':
          if (!query) return { error: 'Query required for infer' };
          args = `orchestrate infer "${query.replace(/"/g, '\\"')}"`;
          break;
        case 'goal':
          if (!goal) return { error: 'Goal required' };
          args = `orchestrate goal "${goal.replace(/"/g, '\\"')}"`;
          break;
        case 'expand':
          args = 'orchestrate expand';
          break;
        case 'stats':
          args = 'orchestrate stats';
          break;
        default:
          return { error: `Unknown action: ${action}` };
      }

      const result = await nmtExec(args, { timeout: 120000 });
      if (!result.success) return { error: result.error };

      return { success: true, action, result: result.data };
    },
  },

  // -------------------- State Sync --------------------
  'nmt-sync': {
    name: 'nmt-sync',
    description: 'State synchronization across distributed nodes',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['status', 'changes', 'export', 'import', 'peers'],
          description: 'Sync action',
        },
        path: { type: 'string', description: 'File path for export/import' },
      },
      required: ['action'],
    },
    handler: async (params) => {
      const { action, path } = params;

      let args;
      switch (action) {
        case 'status':
          args = 'sync status';
          break;
        case 'changes':
          args = 'sync changes';
          break;
        case 'export':
          if (!path) return { error: 'Path required for export' };
          args = `sync export "${path}"`;
          break;
        case 'import':
          if (!path) return { error: 'Path required for import' };
          args = `sync import "${path}"`;
          break;
        case 'peers':
          args = 'sync peers';
          break;
        default:
          return { error: `Unknown action: ${action}` };
      }

      const result = await nmtExec(args);
      if (!result.success) return { error: result.error };

      return { success: true, action, result: result.data };
    },
  },

  // ============================================================
  // Autonomous Recursive Learning (자율 재귀학습)
  // ============================================================

  'nmt-auto-learn': {
    name: 'nmt-auto-learn',
    description: 'Autonomous recursive learning - records interactions and triggers learning cycles',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['record', 'cycle', 'status', 'analyze', 'optimize'],
          description: 'Auto-learning action',
        },
        userQuery: { type: 'string', description: 'User query (for record)' },
        assistantResponse: { type: 'string', description: 'Assistant response (for record)' },
        feedback: {
          type: 'string',
          enum: ['positive', 'negative', 'neutral'],
          description: 'User feedback',
        },
        toolsUsed: { type: 'array', description: 'Tools used in this interaction' },
      },
      required: ['action'],
    },
    handler: async (params) => {
      const { action, userQuery, assistantResponse, feedback, toolsUsed } = params;

      const state = loadLearningState();

      switch (action) {
        case 'record': {
          // Record interaction for later learning
          if (!userQuery || !assistantResponse) {
            return { error: 'userQuery and assistantResponse required for record' };
          }

          const interaction = {
            id: `int-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userQuery: userQuery.substring(0, 5000),
            assistantResponse: assistantResponse.substring(0, 5000),
            feedback: feedback || 'neutral',
            toolsUsed: toolsUsed || [],
          };

          state.interactions.push(interaction);
          state.totalInteractions++;

          // Keep last 1000 interactions
          if (state.interactions.length > 1000) {
            state.interactions = state.interactions.slice(-1000);
          }

          // Update success rate
          const positiveCount = state.interactions.filter(i => i.feedback === 'positive').length;
          state.successRate = state.interactions.length > 0
            ? (positiveCount / state.interactions.length) * 100
            : 0;

          saveLearningState(state);

          // Also ingest to NMT for semantic indexing
          const ingestResult = await nmtExec(
            `ingest-text "${`Q: ${userQuery.substring(0, 1000)}\nA: ${assistantResponse.substring(0, 1000)}`.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" -s jarvis-interaction -t "${feedback || 'neutral'},auto-learn"`,
            { timeout: 30000 }
          );

          return {
            success: true,
            action: 'record',
            interactionId: interaction.id,
            totalInteractions: state.totalInteractions,
            successRate: state.successRate.toFixed(1) + '%',
            nmtIngested: ingestResult.success,
          };
        }

        case 'cycle': {
          // Run a full learning cycle
          const cycleResults = {
            patternAnalysis: null,
            outcomeAnalysis: null,
            dimensionExpansion: null,
            attractorUpdate: null,
          };

          // 1. Pattern recognition
          const patternResult = await nmtExec('learn patterns', { timeout: 120000 });
          cycleResults.patternAnalysis = patternResult.success ? patternResult.data : null;

          // 2. Outcome analysis
          const outcomeResult = await nmtExec('learn outcomes', { timeout: 120000 });
          cycleResults.outcomeAnalysis = outcomeResult.success ? outcomeResult.data : null;

          // 3. Dimension expansion (if needed)
          const dimResult = await nmtExec('dimension analyze', { timeout: 60000 });
          cycleResults.dimensionExpansion = dimResult.success ? dimResult.data : null;

          // 4. Update attractors based on learned patterns
          if (state.interactions.length > 10) {
            // Create attractors for frequently successful patterns
            const successfulPatterns = state.interactions
              .filter(i => i.feedback === 'positive')
              .slice(-10);

            if (successfulPatterns.length > 0) {
              const patternSummary = successfulPatterns
                .map(i => i.toolsUsed?.join(',') || 'general')
                .join('; ');

              const attractorResult = await nmtExec(
                `attractor create "Optimize: ${patternSummary.substring(0, 100)}" --strength 0.7`
              );
              cycleResults.attractorUpdate = attractorResult.success ? attractorResult.data : null;
            }
          }

          state.lastLearnTime = new Date().toISOString();
          saveLearningState(state);

          return {
            success: true,
            action: 'cycle',
            results: cycleResults,
            interactionsProcessed: state.interactions.length,
            lastLearnTime: state.lastLearnTime,
          };
        }

        case 'status': {
          return {
            success: true,
            action: 'status',
            totalInteractions: state.totalInteractions,
            recentInteractions: state.interactions.length,
            successRate: state.successRate.toFixed(1) + '%',
            lastLearnTime: state.lastLearnTime,
            feedbackBreakdown: {
              positive: state.interactions.filter(i => i.feedback === 'positive').length,
              negative: state.interactions.filter(i => i.feedback === 'negative').length,
              neutral: state.interactions.filter(i => i.feedback === 'neutral').length,
            },
          };
        }

        case 'analyze': {
          // Analyze patterns in recorded interactions
          const toolUsage = {};
          const feedbackByTool = {};

          for (const interaction of state.interactions) {
            for (const tool of (interaction.toolsUsed || [])) {
              toolUsage[tool] = (toolUsage[tool] || 0) + 1;
              if (!feedbackByTool[tool]) {
                feedbackByTool[tool] = { positive: 0, negative: 0, neutral: 0 };
              }
              feedbackByTool[tool][interaction.feedback]++;
            }
          }

          // Query NMT for semantic patterns
          const nmtPatterns = await nmtExec('learn stats');

          return {
            success: true,
            action: 'analyze',
            toolUsage,
            feedbackByTool,
            topTools: Object.entries(toolUsage)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([tool, count]) => ({ tool, count })),
            nmtPatterns: nmtPatterns.success ? nmtPatterns.data : null,
          };
        }

        case 'optimize': {
          // Optimize based on learning
          const optimizations = [];

          // Analyze tool success rates
          const toolSuccess = {};
          for (const interaction of state.interactions) {
            for (const tool of (interaction.toolsUsed || [])) {
              if (!toolSuccess[tool]) toolSuccess[tool] = { success: 0, total: 0 };
              toolSuccess[tool].total++;
              if (interaction.feedback === 'positive') toolSuccess[tool].success++;
            }
          }

          // Find underperforming tools
          for (const [tool, stats] of Object.entries(toolSuccess)) {
            const rate = stats.total > 5 ? (stats.success / stats.total) : null;
            if (rate !== null && rate < 0.5) {
              optimizations.push({
                type: 'tool_improvement',
                tool,
                successRate: (rate * 100).toFixed(1) + '%',
                recommendation: `Tool "${tool}" has low success rate. Consider reviewing usage patterns.`,
              });
            }
          }

          // Run NMT orchestration for optimization suggestions
          const orchResult = await nmtExec('orchestrate stats', { timeout: 60000 });
          if (orchResult.success) {
            optimizations.push({
              type: 'nmt_optimization',
              data: orchResult.data,
            });
          }

          return {
            success: true,
            action: 'optimize',
            optimizations,
            toolSuccessRates: Object.fromEntries(
              Object.entries(toolSuccess)
                .map(([tool, stats]) => [
                  tool,
                  stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) + '%' : 'N/A'
                ])
            ),
          };
        }

        default:
          return { error: `Unknown action: ${action}` };
      }
    },
  },

  // -------------------- Context Augmentation --------------------
  'nmt-context': {
    name: 'nmt-context',
    description: 'Augment conversation context with relevant knowledge from NMT',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Current conversation context or query' },
        maxResults: { type: 'number', description: 'Max relevant items (default: 5)', default: 5 },
        includeInference: { type: 'boolean', description: 'Include inference chains', default: true },
      },
      required: ['query'],
    },
    handler: async (params) => {
      const { query, maxResults = 5, includeInference = true } = params;

      if (!query) return { error: 'Query is required' };

      // 1. Semantic search for relevant knowledge
      const searchResult = await nmtExec(
        `search "${query.replace(/"/g, '\\"').substring(0, 500)}" -k ${maxResults} --content`
      );

      const context = {
        relevantKnowledge: [],
        inference: null,
        attractors: null,
      };

      if (searchResult.success && searchResult.data.results) {
        context.relevantKnowledge = searchResult.data.results.map(r => ({
          id: r.neuronId,
          score: r.score,
          content: r.content?.substring(0, 500),
          tags: r.tags,
        }));

        // 2. Run inference on top result if available
        if (includeInference && context.relevantKnowledge.length > 0) {
          const topNeuronId = context.relevantKnowledge[0].id;
          const inferResult = await nmtExec(`infer bidirectional ${topNeuronId} --depth 2`);
          if (inferResult.success) {
            context.inference = inferResult.data;
          }
        }
      }

      // 3. Get active attractors for goal-oriented context
      const attractorResult = await nmtExec('attractor list');
      if (attractorResult.success) {
        context.attractors = attractorResult.data;
      }

      return {
        success: true,
        query: query.substring(0, 100) + '...',
        context,
        augmentedPrompt: context.relevantKnowledge.length > 0
          ? `[Context from knowledge base]:\n${context.relevantKnowledge.map(k => `- ${k.content}`).join('\n')}\n\n`
          : null,
      };
    },
  },

  // -------------------- Status Check --------------------
  'nmt-status': {
    name: 'nmt-status',
    description: 'Check NMT system availability and status',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const available = await checkNmtAvailable();

      if (available) {
        const stats = await nmtExec('stats');
        const learningState = loadLearningState();

        return {
          success: true,
          available: true,
          nmtPath: NMT_CONFIG.nmtPath,
          useGlobalCli: NMT_CONFIG.useGlobalCli,
          stats: stats.success ? stats.data : null,
          autoLearning: {
            totalInteractions: learningState.totalInteractions,
            successRate: learningState.successRate.toFixed(1) + '%',
            lastLearnTime: learningState.lastLearnTime,
          },
        };
      }

      return {
        success: false,
        available: false,
        error: 'NMT system not available',
        nmtPath: NMT_CONFIG.nmtPath,
        hint: 'Run: npm install -g @ninebix/nmt-system',
      };
    },
  },
};

export default nmtTools;
