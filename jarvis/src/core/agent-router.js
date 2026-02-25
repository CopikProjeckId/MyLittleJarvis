// JARVIS Light - Core Agent Router
// 3-Agent Smart Routing System

// Quick Pattern Match - No LLM needed
const LOCAL_ONLY_PATTERNS = [
  /^(hi|hello|hey|yo|안녕|안녕하세요|반갑)/i,
  /^(bye|goodbye|잘가|안녕)/i,
  /^(thanks?|고마워|감사)/i,
  /\b(what\s+time|시간|날짜)\b/i,
  /^(ping|status|상태)\b/i,
];

// Cloud Required Patterns
const CLOUD_REQUIRED_PATTERNS = [
  /\b(refactor|리팩토링)\b/i,
  /\b(debug|fix|버그|수정)\b/i,
  /\b(implement|구현|만들어)\b/i,
  /\b(review|리뷰|검토)\b/i,
  /\b(test|테스트)\b/i,
];

export class AgentRouter {
  constructor(options = {}) {
    this.ollamaHost = options.ollamaHost || 'localhost:11434';
    this.primaryModel = options.primaryModel || 'qwen3.5';
    this.localModel = options.localModel || 'qwen2.5:1.5b';
  }

  async route(input) {
    const text = input.trim();

    // 1. Quick pattern match
    if (this.matchesAny(text, LOCAL_ONLY_PATTERNS)) {
      return { agent: 'orchestrator', model: this.localModel, reason: 'local-only pattern' };
    }

    // 2. Cloud required
    if (this.matchesAny(text, CLOUD_REQUIRED_PATTERNS)) {
      return { agent: 'claude', model: this.primaryModel, reason: 'cloud-required pattern' };
    }

    // 3. Default to assistant
    return { agent: 'assistant', model: this.localModel, reason: 'default routing' };
  }

  matchesAny(text, patterns) {
    return patterns.some(p => p.test(text));
  }
}

export default AgentRouter;
