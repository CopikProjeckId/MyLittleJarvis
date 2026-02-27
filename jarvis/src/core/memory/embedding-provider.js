// JARVIS Embedding Provider
// Supports Ollama, OpenAI, and local TF-IDF fallback

export class EmbeddingProvider {
  constructor(options = {}) {
    this.provider = options.provider || process.env.EMBEDDING_PROVIDER || 'local';
    this.dimension = options.dimension || 384;
    this.ollamaHost = options.ollamaHost || process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.ollamaModel = options.ollamaModel || 'nomic-embed-text';
    this.openaiKey = options.openaiKey || process.env.OPENAI_API_KEY;
    this.openaiModel = options.openaiModel || 'text-embedding-3-small';
    this.cache = new Map();
    this.cacheMaxSize = options.cacheMaxSize || 1000;
  }

  /**
   * Generate embedding for text
   */
  async embed(text) {
    if (!text || typeof text !== 'string') {
      return this.zeroVector();
    }

    // Check cache
    const cacheKey = this.hashText(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let embedding;
    try {
      switch (this.provider) {
        case 'ollama':
          embedding = await this.ollamaEmbed(text);
          break;
        case 'openai':
          embedding = await this.openaiEmbed(text);
          break;
        default:
          embedding = this.localEmbed(text);
      }
    } catch (error) {
      console.warn(`Embedding provider ${this.provider} failed, using local fallback:`, error.message);
      embedding = this.localEmbed(text);
    }

    // Cache result
    this.cacheEmbedding(cacheKey, embedding);

    return embedding;
  }

  /**
   * Batch embed multiple texts
   */
  async embedBatch(texts) {
    const results = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }

  /**
   * Ollama embeddings
   */
  async ollamaEmbed(text) {
    const response = await fetch(`${this.ollamaHost}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.ollamaModel,
        prompt: text.substring(0, 8000) // Limit input length
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response from Ollama');
    }

    return data.embedding;
  }

  /**
   * OpenAI embeddings
   */
  async openaiEmbed(text) {
    if (!this.openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiKey}`
      },
      body: JSON.stringify({
        model: this.openaiModel,
        input: text.substring(0, 8000)
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI embedding failed: ${error.error?.message || response.status}`);
    }

    const data = await response.json();

    if (!data.data?.[0]?.embedding) {
      throw new Error('Invalid embedding response from OpenAI');
    }

    return data.data[0].embedding;
  }

  /**
   * Local TF-IDF style embedding (lightweight, no external dependencies)
   */
  localEmbed(text) {
    const normalizedText = text.toLowerCase();
    const words = this.tokenize(normalizedText);

    // Initialize vector
    const vector = new Array(this.dimension).fill(0);

    if (words.length === 0) {
      return vector;
    }

    // Word frequency
    const wordFreq = new Map();
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    // Generate embedding using hashing trick
    for (const [word, freq] of wordFreq) {
      const hash = this.hashWord(word);
      const tf = freq / words.length;

      // Multiple hash positions for better distribution
      for (let i = 0; i < 4; i++) {
        const idx = Math.abs((hash + i * 31337) % this.dimension);
        const sign = ((hash >> i) & 1) ? 1 : -1;
        vector[idx] += sign * tf;
      }

      // Add character n-grams for subword information
      const ngrams = this.getCharNgrams(word, 3);
      for (const ngram of ngrams) {
        const ngramHash = this.hashWord(ngram);
        const idx = Math.abs(ngramHash % this.dimension);
        vector[idx] += 0.1 / ngrams.length;
      }
    }

    // L2 normalize
    return this.normalize(vector);
  }

  /**
   * Tokenize text into words
   */
  tokenize(text) {
    // Handle Korean and English
    const words = text
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1)
      .filter(w => !this.isStopWord(w));

    return words;
  }

  /**
   * Get character n-grams
   */
  getCharNgrams(word, n) {
    const ngrams = [];
    for (let i = 0; i <= word.length - n; i++) {
      ngrams.push(word.substring(i, i + n));
    }
    return ngrams;
  }

  /**
   * Check if word is a stop word
   */
  isStopWord(word) {
    const stopWords = new Set([
      // English
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'or', 'and', 'but', 'if',
      'this', 'that', 'it', 'its',
      // Korean particles
      '이', '가', '은', '는', '을', '를', '의', '에', '에서', '와', '과',
      '도', '로', '으로', '만', '까지', '부터', '이다', '하다'
    ]);
    return stopWords.has(word);
  }

  /**
   * Hash a word to integer
   */
  hashWord(word) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      const char = word.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Hash text for cache key
   */
  hashText(text) {
    let hash = 0;
    const str = text.substring(0, 1000); // Limit for cache key
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * L2 normalize vector
   */
  normalize(vector) {
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm === 0) return vector;
    return vector.map(v => v / norm);
  }

  /**
   * Zero vector
   */
  zeroVector() {
    return new Array(this.dimension).fill(0);
  }

  /**
   * Cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  /**
   * Cache embedding
   */
  cacheEmbedding(key, embedding) {
    // Evict oldest if cache full
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, embedding);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get provider info
   */
  getInfo() {
    return {
      provider: this.provider,
      dimension: this.dimension,
      cacheSize: this.cache.size,
      ollamaHost: this.provider === 'ollama' ? this.ollamaHost : undefined,
      ollamaModel: this.provider === 'ollama' ? this.ollamaModel : undefined
    };
  }
}

export default EmbeddingProvider;
