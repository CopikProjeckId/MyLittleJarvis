// JARVIS Light - Memory Manager with MerkleDB Schema

export class MemoryManager {
  constructor() {
    this.conversations = new Map();
    this.contextCache = [];
    this.maxContextSize = 10;
  }

  async init() {
    console.log('📚 Memory Manager initialized (MerkleDB schema ready)');
  }

  async addMessage(role, content, metadata = {}) {
    const message = {
      id: this.generateHash(content + Date.now()),
      role,
      content,
      timestamp: Date.now(),
      parentHash: this.contextCache.length > 0 
        ? this.contextCache[this.contextCache.length - 1].id 
        : null,
      metadata,
    };

    this.contextCache.push(message);

    // LRU eviction
    if (this.contextCache.length > this.maxContextSize) {
      this.contextCache.shift();
    }

    return message;
  }

  getContext() {
    return this.contextCache.slice(-this.maxContextSize);
  }

  clear() {
    this.contextCache = [];
  }

  generateHash(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

export default MemoryManager;
