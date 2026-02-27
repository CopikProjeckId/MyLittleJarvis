// JARVIS Autonomous Recursive Learning System
// Integrates NMT with JARVIS for continuous self-improvement
// 자율 재귀학습 시스템

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { EventEmitter } from 'events';

// ============================================================
// Configuration
// ============================================================

const CONFIG = {
  stateDir: join(homedir(), '.jarvis', 'learning'),
  minInteractionsForCycle: 10,       // Minimum interactions before learning
  autoLearnInterval: 30 * 60 * 1000, // Auto-learn every 30 minutes
  maxInteractionHistory: 1000,
  feedbackWindowMs: 5 * 60 * 1000,   // 5 minutes to provide feedback
};

// ============================================================
// Learning State Manager
// ============================================================

class LearningStateManager {
  constructor() {
    this.stateFile = join(CONFIG.stateDir, 'state.json');
    this.state = this.load();
  }

  load() {
    try {
      if (!existsSync(CONFIG.stateDir)) {
        mkdirSync(CONFIG.stateDir, { recursive: true });
      }
      if (existsSync(this.stateFile)) {
        return JSON.parse(readFileSync(this.stateFile, 'utf-8'));
      }
    } catch (error) {
      console.error('Failed to load learning state:', error.message);
    }

    return {
      version: 1,
      totalInteractions: 0,
      successfulInteractions: 0,
      learningCycles: 0,
      lastLearningCycle: null,
      interactions: [],
      patterns: [],
      toolPreferences: {},
      contextMemory: [],
    };
  }

  save() {
    try {
      writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Failed to save learning state:', error.message);
    }
  }

  addInteraction(interaction) {
    this.state.interactions.push(interaction);
    this.state.totalInteractions++;

    if (interaction.feedback === 'positive') {
      this.state.successfulInteractions++;
    }

    // Trim old interactions
    if (this.state.interactions.length > CONFIG.maxInteractionHistory) {
      this.state.interactions = this.state.interactions.slice(-CONFIG.maxInteractionHistory);
    }

    // Update tool preferences
    for (const tool of (interaction.toolsUsed || [])) {
      if (!this.state.toolPreferences[tool]) {
        this.state.toolPreferences[tool] = { uses: 0, successes: 0 };
      }
      this.state.toolPreferences[tool].uses++;
      if (interaction.feedback === 'positive') {
        this.state.toolPreferences[tool].successes++;
      }
    }

    this.save();
    return interaction;
  }

  recordLearningCycle(results) {
    this.state.learningCycles++;
    this.state.lastLearningCycle = new Date().toISOString();

    if (results.patterns) {
      this.state.patterns = results.patterns;
    }

    this.save();
  }

  getState() {
    return { ...this.state };
  }

  getSuccessRate() {
    if (this.state.totalInteractions === 0) return 0;
    return (this.state.successfulInteractions / this.state.totalInteractions) * 100;
  }

  getToolSuccessRates() {
    const rates = {};
    for (const [tool, stats] of Object.entries(this.state.toolPreferences)) {
      rates[tool] = stats.uses > 0
        ? ((stats.successes / stats.uses) * 100).toFixed(1) + '%'
        : 'N/A';
    }
    return rates;
  }

  shouldTriggerLearning() {
    if (this.state.interactions.length < CONFIG.minInteractionsForCycle) {
      return false;
    }

    if (!this.state.lastLearningCycle) {
      return true;
    }

    const lastCycle = new Date(this.state.lastLearningCycle);
    const now = new Date();
    return (now - lastCycle) >= CONFIG.autoLearnInterval;
  }
}

// ============================================================
// Autonomous Learning Engine
// ============================================================

export class AutonomousLearningEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.nmtTools = options.nmtTools || null;
    this.stateManager = new LearningStateManager();
    this.autoLearnTimer = null;
    this.pendingFeedback = new Map(); // interactionId -> timeout
  }

  /**
   * Initialize the learning engine
   */
  async init() {
    // Start auto-learning timer
    this.autoLearnTimer = setInterval(
      () => this.checkAndTriggerLearning(),
      CONFIG.autoLearnInterval
    );

    this.emit('initialized', {
      totalInteractions: this.stateManager.state.totalInteractions,
      successRate: this.stateManager.getSuccessRate().toFixed(1) + '%',
    });

    return this;
  }

  /**
   * Shutdown the learning engine
   */
  async shutdown() {
    if (this.autoLearnTimer) {
      clearInterval(this.autoLearnTimer);
      this.autoLearnTimer = null;
    }

    // Clear pending feedback timers
    for (const [id, timeout] of this.pendingFeedback) {
      clearTimeout(timeout);
    }
    this.pendingFeedback.clear();
  }

  /**
   * Record a conversation interaction
   */
  async recordInteraction(data) {
    const {
      userQuery,
      assistantResponse,
      toolsUsed = [],
      context = {},
      sessionId,
    } = data;

    const interaction = {
      id: `int-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userQuery: userQuery?.substring(0, 5000),
      assistantResponse: assistantResponse?.substring(0, 5000),
      toolsUsed,
      context,
      sessionId,
      feedback: 'neutral', // Default, can be updated later
    };

    this.stateManager.addInteraction(interaction);

    // Set timeout for implicit neutral feedback
    const feedbackTimeout = setTimeout(() => {
      this.pendingFeedback.delete(interaction.id);
    }, CONFIG.feedbackWindowMs);

    this.pendingFeedback.set(interaction.id, feedbackTimeout);

    // Emit event for other components
    this.emit('interaction-recorded', interaction);

    // Ingest to NMT if available
    if (this.nmtTools) {
      try {
        await this.ingestToNmt(interaction);
      } catch (error) {
        console.error('Failed to ingest to NMT:', error.message);
      }
    }

    // Check if we should trigger learning
    if (this.stateManager.shouldTriggerLearning()) {
      setImmediate(() => this.triggerLearningCycle());
    }

    return interaction;
  }

  /**
   * Update feedback for an interaction
   */
  async updateFeedback(interactionId, feedback) {
    const interaction = this.stateManager.state.interactions.find(
      i => i.id === interactionId
    );

    if (!interaction) {
      return { error: 'Interaction not found' };
    }

    // Clear pending feedback timer
    if (this.pendingFeedback.has(interactionId)) {
      clearTimeout(this.pendingFeedback.get(interactionId));
      this.pendingFeedback.delete(interactionId);
    }

    // Update feedback
    const oldFeedback = interaction.feedback;
    interaction.feedback = feedback;

    // Update success count
    if (oldFeedback !== 'positive' && feedback === 'positive') {
      this.stateManager.state.successfulInteractions++;
    } else if (oldFeedback === 'positive' && feedback !== 'positive') {
      this.stateManager.state.successfulInteractions--;
    }

    // Update tool preferences
    for (const tool of (interaction.toolsUsed || [])) {
      const pref = this.stateManager.state.toolPreferences[tool];
      if (pref) {
        if (oldFeedback === 'positive') pref.successes--;
        if (feedback === 'positive') pref.successes++;
      }
    }

    this.stateManager.save();

    this.emit('feedback-updated', { interactionId, feedback });

    return { success: true, interactionId, feedback };
  }

  /**
   * Ingest interaction to NMT knowledge graph
   */
  async ingestToNmt(interaction) {
    if (!this.nmtTools || !this.nmtTools['nmt-ingest']) {
      return null;
    }

    const text = `User Query: ${interaction.userQuery}\n\nAssistant Response: ${interaction.assistantResponse}`;
    const tags = [
      'jarvis-interaction',
      interaction.feedback,
      ...(interaction.toolsUsed || []).slice(0, 5),
    ].join(',');

    return await this.nmtTools['nmt-ingest'].handler({
      text,
      tags,
      sourceType: 'jarvis-auto-learn',
    });
  }

  /**
   * Trigger a full learning cycle
   */
  async triggerLearningCycle() {
    this.emit('learning-cycle-start', {
      interactionsToProcess: this.stateManager.state.interactions.length,
    });

    const results = {
      patterns: null,
      outcomes: null,
      optimizations: null,
      attractors: null,
    };

    try {
      if (this.nmtTools) {
        // 1. Pattern recognition
        if (this.nmtTools['nmt-learn']) {
          const patternResult = await this.nmtTools['nmt-learn'].handler({
            stage: 'patterns',
          });
          results.patterns = patternResult.success ? patternResult.result : null;
        }

        // 2. Outcome analysis
        if (this.nmtTools['nmt-learn']) {
          const outcomeResult = await this.nmtTools['nmt-learn'].handler({
            stage: 'outcomes',
          });
          results.outcomes = outcomeResult.success ? outcomeResult.result : null;
        }

        // 3. Create attractors for successful patterns
        if (this.nmtTools['nmt-attractor']) {
          const successPatterns = this.analyzeSuccessPatterns();
          if (successPatterns.length > 0) {
            const attractorResult = await this.nmtTools['nmt-attractor'].handler({
              action: 'create',
              description: `Optimize: ${successPatterns.join(', ')}`,
              strength: 0.7,
            });
            results.attractors = attractorResult.success ? attractorResult.result : null;
          }
        }

        // 4. Analyze and optimize
        results.optimizations = this.generateOptimizations();
      }

      this.stateManager.recordLearningCycle(results);

      this.emit('learning-cycle-complete', {
        results,
        totalInteractions: this.stateManager.state.totalInteractions,
        successRate: this.stateManager.getSuccessRate().toFixed(1) + '%',
        learningCycles: this.stateManager.state.learningCycles,
      });

      return results;
    } catch (error) {
      this.emit('learning-cycle-error', { error: error.message });
      throw error;
    }
  }

  /**
   * Check and trigger learning if needed
   */
  async checkAndTriggerLearning() {
    if (this.stateManager.shouldTriggerLearning()) {
      return this.triggerLearningCycle();
    }
    return null;
  }

  /**
   * Analyze successful interaction patterns
   */
  analyzeSuccessPatterns() {
    const patterns = [];
    const toolCombos = {};

    const successfulInteractions = this.stateManager.state.interactions
      .filter(i => i.feedback === 'positive')
      .slice(-100);

    for (const interaction of successfulInteractions) {
      const tools = (interaction.toolsUsed || []).sort().join('+');
      if (tools) {
        toolCombos[tools] = (toolCombos[tools] || 0) + 1;
      }
    }

    // Find frequent successful tool combinations
    for (const [combo, count] of Object.entries(toolCombos)) {
      if (count >= 3) {
        patterns.push(`${combo} (${count}x)`);
      }
    }

    return patterns.slice(0, 5);
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimizations() {
    const optimizations = [];
    const toolRates = this.stateManager.getToolSuccessRates();

    // Find underperforming tools
    for (const [tool, rateStr] of Object.entries(toolRates)) {
      const rate = parseFloat(rateStr);
      if (!isNaN(rate) && rate < 50) {
        optimizations.push({
          type: 'tool_improvement',
          tool,
          currentRate: rateStr,
          recommendation: `Consider reviewing ${tool} usage patterns`,
        });
      }
    }

    // Overall improvement suggestions
    const overallRate = this.stateManager.getSuccessRate();
    if (overallRate < 70) {
      optimizations.push({
        type: 'general',
        recommendation: 'Overall success rate is below 70%. Consider reviewing interaction patterns.',
      });
    }

    return optimizations;
  }

  /**
   * Get augmented context for a query using NMT
   */
  async getAugmentedContext(query, options = {}) {
    if (!this.nmtTools || !this.nmtTools['nmt-context']) {
      return null;
    }

    const result = await this.nmtTools['nmt-context'].handler({
      query,
      maxResults: options.maxResults || 5,
      includeInference: options.includeInference !== false,
    });

    return result.success ? result.context : null;
  }

  /**
   * Get learning statistics
   */
  getStats() {
    const state = this.stateManager.getState();
    return {
      totalInteractions: state.totalInteractions,
      successfulInteractions: state.successfulInteractions,
      successRate: this.stateManager.getSuccessRate().toFixed(1) + '%',
      learningCycles: state.learningCycles,
      lastLearningCycle: state.lastLearningCycle,
      toolSuccessRates: this.stateManager.getToolSuccessRates(),
      recentInteractions: state.interactions.length,
      patterns: state.patterns,
    };
  }

  /**
   * Export learning data for backup
   */
  exportData() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      state: this.stateManager.getState(),
    };
  }

  /**
   * Import learning data
   */
  importData(data) {
    if (data.version !== 1) {
      throw new Error('Unsupported data version');
    }

    this.stateManager.state = data.state;
    this.stateManager.save();

    this.emit('data-imported', { importedAt: new Date().toISOString() });

    return { success: true };
  }
}

// ============================================================
// Singleton Instance
// ============================================================

let _instance = null;

export function getAutonomousLearningEngine(options = {}) {
  if (!_instance) {
    _instance = new AutonomousLearningEngine(options);
  }
  return _instance;
}

export function resetAutonomousLearningEngine() {
  if (_instance) {
    _instance.shutdown();
    _instance = null;
  }
}

export default AutonomousLearningEngine;
