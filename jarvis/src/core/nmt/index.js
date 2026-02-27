// JARVIS NMT Integration Module
// Complete integration with Neuron Merkle Tree system
// 확률적 존재론 + 자율 재귀학습 + 컨텍스트 증강

export {
  AutonomousLearningEngine,
  getAutonomousLearningEngine,
  resetAutonomousLearningEngine,
} from './autonomous-learning.js';

export {
  ContextAugmentationEngine,
  getContextAugmentationEngine,
  resetContextAugmentationEngine,
  createContextAugmentationMiddleware,
} from './context-augmentation.js';

export {
  JarvisWithNmt,
  createJarvisWithNmt,
} from './jarvis-nmt-integration.js';

// ============================================================
// NMT Integration Manager
// ============================================================

import { getAutonomousLearningEngine } from './autonomous-learning.js';
import { getContextAugmentationEngine } from './context-augmentation.js';

export class NmtIntegrationManager {
  constructor(options = {}) {
    this.nmtTools = options.nmtTools || null;
    this.learningEngine = null;
    this.contextEngine = null;
    this.initialized = false;
  }

  /**
   * Initialize NMT integration
   */
  async init(nmtTools) {
    this.nmtTools = nmtTools;

    // Initialize autonomous learning
    this.learningEngine = getAutonomousLearningEngine({ nmtTools });
    await this.learningEngine.init();

    // Initialize context augmentation
    this.contextEngine = getContextAugmentationEngine({ nmtTools });
    this.contextEngine.setNmtTools(nmtTools);

    this.initialized = true;

    return this;
  }

  /**
   * Record an interaction for learning
   */
  async recordInteraction(data) {
    if (!this.learningEngine) return null;
    return this.learningEngine.recordInteraction(data);
  }

  /**
   * Update feedback for an interaction
   */
  async updateFeedback(interactionId, feedback) {
    if (!this.learningEngine) return null;
    return this.learningEngine.updateFeedback(interactionId, feedback);
  }

  /**
   * Augment a query with relevant context
   */
  async augmentQuery(query, options = {}) {
    if (!this.contextEngine) return { augmented: false, query };
    return this.contextEngine.augmentQuery(query, options);
  }

  /**
   * Trigger a learning cycle manually
   */
  async triggerLearning() {
    if (!this.learningEngine) return null;
    return this.learningEngine.triggerLearningCycle();
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      learning: this.learningEngine?.getStats() || null,
      context: this.contextEngine?.getStats() || null,
    };
  }

  /**
   * Shutdown all engines
   */
  async shutdown() {
    if (this.learningEngine) {
      await this.learningEngine.shutdown();
    }
    if (this.contextEngine) {
      this.contextEngine.clearCache();
    }
    this.initialized = false;
  }
}

// ============================================================
// Singleton Instance
// ============================================================

let _manager = null;

export function getNmtIntegrationManager(options = {}) {
  if (!_manager) {
    _manager = new NmtIntegrationManager(options);
  }
  return _manager;
}

export function resetNmtIntegrationManager() {
  if (_manager) {
    _manager.shutdown();
    _manager = null;
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Create a pre-configured NMT integration for JARVIS
 */
export async function createNmtIntegration(nmtTools) {
  const manager = getNmtIntegrationManager();
  await manager.init(nmtTools);
  return manager;
}

/**
 * Wrap a JARVIS handler with NMT integration
 */
export function withNmtIntegration(handler, manager) {
  return async function nmtIntegratedHandler(ctx) {
    // Augment context before processing
    if (ctx.userQuery) {
      const augmentation = await manager.augmentQuery(ctx.userQuery);
      if (augmentation.augmented) {
        ctx.nmtContext = augmentation.context;
        ctx.systemPromptAddition = augmentation.context.augmentedPrompt;
      }
    }

    // Process the request
    const result = await handler(ctx);

    // Record interaction for learning
    if (ctx.userQuery && result?.response) {
      await manager.recordInteraction({
        userQuery: ctx.userQuery,
        assistantResponse: result.response,
        toolsUsed: result.toolsUsed || [],
        context: ctx.nmtContext || {},
        sessionId: ctx.sessionId,
      });
    }

    return result;
  };
}

export default NmtIntegrationManager;
