// JARVIS Tool Implementations
// Real implementations for CLI tools
// Now includes modular tools from ./tools/

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, unlinkSync } from 'fs';
import { join, dirname, basename } from 'path';

// Import modular tools
import { fileTools, editHistory } from './tools/file.js';
import { bashTools, hasCommand } from './tools/bash.js';
import { gitTools } from './tools/git.js';
import { registry, allTools, toolImplementations as modularTools } from './tools/index.js';

// ============================================================
// Intent Detection - Smart Tool Routing
// ============================================================

// Time/date words and question words that should not be treated as locations
const SKIP_WORDS = [
  // Time words
  '오늘', '내일', '모레', '어제', '오전', '오후', '저녁', '아침',
  'today', 'tomorrow', 'yesterday',
  // Question words
  '어때', '어때요', '어떻', '어떻게', '어떤', '뭐야', '뭐예요', '알려줘', '알려주세요',
  'how', 'what', 'please'
];

export function detectIntent(query) {
  const lower = query.toLowerCase();

  // Weather patterns (Korean + English)
  if (/날씨|기온|비|눈|weather|temperature|forecast/.test(lower)) {
    // Extract location
    const locationPatterns = [
      /(.+?)\s+날씨/,        // "서울 날씨" (require space before 날씨)
      /날씨\s+(.+)/,         // "날씨 서울"
      /weather\s+(?:in\s+)?(.+)/i,  // "weather in Seoul"
      /(.+?)\s+기온/,        // "서울 기온"
    ];

    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        // Remove trailing particles only (을, 를, 이, 가, 은, 는, 에, 로, 의)
        // Note: Don't include 서 as it's part of 서울 (Seoul)
        let location = match[1].replace(/[을를이가은는에로의]$/g, '').trim();
        // Also remove common question endings
        location = location.replace(/[?？어때요어때]$/g, '').trim();

        // Skip time/question words
        if (SKIP_WORDS.includes(location.toLowerCase())) {
          continue;
        }

        if (location.length >= 2) {
          return { tool: 'weather', params: { location } };
        }
      }
    }
    return { tool: 'weather', params: { location: 'Seoul' } }; // Default
  }

  // URL shortening
  if (/단축|shorten|짧게/.test(lower) && /https?:\/\//.test(query)) {
    const urlMatch = query.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      return { tool: 'shorten', params: { url: urlMatch[1] } };
    }
  }

  // Time/date queries - no tool needed, can answer directly
  if (/몇\s*시|시간|what\s+time|현재\s*시간/.test(lower)) {
    return { tool: 'direct', response: `현재 시간: ${new Date().toLocaleString('ko-KR')}` };
  }

  // File operations
  if (/파일\s*(읽|열|보여|목록)|read\s+file|list\s+files?|cat\s+/.test(lower)) {
    return { tool: 'file', inferred: true };
  }

  // Web search (default for "검색", "찾아", "search")
  if (/검색|찾아|search|what is|who is|뭐야|누구/.test(lower)) {
    return { tool: 'web-search', params: { query } };
  }

  return null; // No specific intent detected
}

// ============================================================
// Web Search (Multi-source: DuckDuckGo + SearXNG fallback)
// ============================================================

// Detect if query contains Korean
function containsKorean(text) {
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
}

// Extract keywords from Korean query for better search
function extractSearchTerms(query) {
  // Remove common Korean particles and verbs
  const particles = ['을', '를', '이', '가', '은', '는', '에', '에서', '로', '으로', '의', '와', '과', '도', '만', '까지', '부터', '해줘', '알려줘', '검색', '찾아', '보여줘'];
  let cleaned = query;
  particles.forEach(p => {
    cleaned = cleaned.replace(new RegExp(p + '\\s*', 'g'), ' ');
  });
  return cleaned.trim();
}

export async function webSearch(params) {
  const { query, language } = params;
  if (!query) {
    return { error: 'Query is required', results: [] };
  }

  const isKorean = containsKorean(query);
  const searchQuery = isKorean ? extractSearchTerms(query) : query;

  // Try multiple search methods
  const results = [];
  let source = '';

  // Method 1: Try SearXNG instances (supports Korean well)
  const searxngInstances = [
    'https://searx.be',
    'https://search.sapti.me',
    'https://searx.tiekoetter.com'
  ];

  for (const instance of searxngInstances) {
    try {
      const encoded = encodeURIComponent(searchQuery);
      const response = await fetch(
        `${instance}/search?q=${encoded}&format=json&language=${isKorean ? 'ko-KR' : 'en-US'}`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          source = 'SearXNG';
          for (const r of data.results.slice(0, 8)) {
            results.push({
              title: r.title || '',
              snippet: r.content || '',
              url: r.url || ''
            });
          }
          break;
        }
      }
    } catch (e) {
      // Try next instance
      continue;
    }
  }

  // Method 2: Fallback to DuckDuckGo (better for English)
  if (results.length === 0) {
    try {
      const encoded = encodeURIComponent(searchQuery);
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (response.ok) {
        const data = await response.json();
        source = 'DuckDuckGo';

        if (data.Answer) {
          results.push({
            title: 'Instant Answer',
            snippet: data.Answer,
            url: ''
          });
        }

        if (data.Abstract) {
          results.push({
            title: data.Heading || searchQuery,
            snippet: data.Abstract,
            url: data.AbstractURL || ''
          });
        }

        if (data.RelatedTopics) {
          for (const topic of data.RelatedTopics.slice(0, 5)) {
            if (topic.Text && topic.FirstURL) {
              results.push({
                title: topic.Text.split(' - ')[0] || '',
                snippet: topic.Text,
                url: topic.FirstURL
              });
            }
          }
        }
      }
    } catch (e) {
      // DuckDuckGo also failed
    }
  }

  // Method 3: Last resort - use Brave Search HTML scraping
  if (results.length === 0) {
    try {
      const encoded = encodeURIComponent(searchQuery);
      const response = await fetch(
        `https://search.brave.com/search?q=${encoded}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html'
          },
          signal: AbortSignal.timeout(10000)
        }
      );

      if (response.ok) {
        const html = await response.text();
        source = 'Brave';

        // Simple extraction of search snippets
        const snippetMatches = html.match(/<p class="snippet[^"]*"[^>]*>([^<]+)<\/p>/g);
        if (snippetMatches) {
          for (const match of snippetMatches.slice(0, 5)) {
            const text = match.replace(/<[^>]+>/g, '').trim();
            if (text.length > 20) {
              results.push({
                title: text.substring(0, 50) + '...',
                snippet: text,
                url: ''
              });
            }
          }
        }
      }
    } catch (e) {
      // All methods failed
    }
  }

  return {
    query,
    searchQuery: searchQuery !== query ? searchQuery : undefined,
    results,
    count: results.length,
    source: source || 'none',
    language: isKorean ? 'ko' : 'en'
  };
}

// ============================================================
// Web Fetch (Extract content from URL)
// ============================================================
export async function webFetch(params) {
  const { url, selector } = params;
  if (!url) {
    return { error: 'URL is required' };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JARVIS/2.0)',
        'Accept': 'text/html,application/json,text/plain'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let content;

    if (contentType.includes('application/json')) {
      content = await response.json();
      return { url, type: 'json', content };
    }

    const text = await response.text();

    // Extract text content from HTML
    if (contentType.includes('text/html')) {
      // Simple HTML to text conversion
      const textContent = text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000); // Limit content

      return {
        url,
        type: 'html',
        title: text.match(/<title>([^<]+)<\/title>/i)?.[1] || '',
        content: textContent,
        length: textContent.length
      };
    }

    return {
      url,
      type: 'text',
      content: text.substring(0, 5000)
    };
  } catch (error) {
    return { url, error: error.message };
  }
}

// ============================================================
// Weather (wttr.in - free, no API key needed)
// ============================================================
export async function weather(params) {
  const { location } = params;
  if (!location) {
    return { error: 'Location is required' };
  }

  try {
    const encoded = encodeURIComponent(location);
    const response = await fetch(
      `https://wttr.in/${encoded}?format=j1`,
      {
        headers: { 'User-Agent': 'JARVIS/2.0' },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current_condition?.[0];
    const area = data.nearest_area?.[0];

    if (!current) {
      return { error: 'No weather data found', location };
    }

    return {
      location: area?.areaName?.[0]?.value || location,
      country: area?.country?.[0]?.value || '',
      temperature: {
        c: parseInt(current.temp_C),
        f: parseInt(current.temp_F)
      },
      feelsLike: {
        c: parseInt(current.FeelsLikeC),
        f: parseInt(current.FeelsLikeF)
      },
      condition: current.weatherDesc?.[0]?.value || '',
      humidity: `${current.humidity}%`,
      wind: {
        speed: `${current.windspeedKmph} km/h`,
        direction: current.winddir16Point
      },
      visibility: `${current.visibility} km`,
      uvIndex: current.uvIndex,
      updated: current.observation_time
    };
  } catch (error) {
    return { location, error: error.message };
  }
}

// ============================================================
// File Operations
// ============================================================
export async function fileOps(params) {
  const { action, path: filePath, content } = params;

  if (!filePath) {
    return { error: 'Path is required' };
  }

  // Security: Prevent path traversal
  if (filePath.includes('..') || filePath.startsWith('/etc') || filePath.startsWith('/root')) {
    return { error: 'Path not allowed', blocked: true };
  }

  try {
    switch (action) {
      case 'read':
        if (!existsSync(filePath)) {
          return { error: 'File not found', path: filePath };
        }
        const fileContent = readFileSync(filePath, 'utf-8');
        return {
          path: filePath,
          content: fileContent.substring(0, 10000), // Limit
          size: statSync(filePath).size,
          truncated: fileContent.length > 10000
        };

      case 'write':
        if (!content) {
          return { error: 'Content is required for write' };
        }
        writeFileSync(filePath, content, 'utf-8');
        return { success: true, path: filePath, written: content.length };

      case 'list':
        if (!existsSync(filePath)) {
          return { error: 'Directory not found', path: filePath };
        }
        const entries = readdirSync(filePath).map(name => {
          const fullPath = join(filePath, name);
          try {
            const stat = statSync(fullPath);
            return {
              name,
              type: stat.isDirectory() ? 'directory' : 'file',
              size: stat.size,
              modified: stat.mtime.toISOString()
            };
          } catch {
            return { name, type: 'unknown' };
          }
        });
        return { path: filePath, entries };

      case 'delete':
        if (!existsSync(filePath)) {
          return { error: 'File not found', path: filePath };
        }
        unlinkSync(filePath);
        return { success: true, deleted: filePath };

      case 'exists':
        return { path: filePath, exists: existsSync(filePath) };

      default:
        return { error: `Unknown action: ${action}` };
    }
  } catch (error) {
    return { error: error.message, path: filePath };
  }
}

// ============================================================
// API Request
// ============================================================
export async function apiRequest(params) {
  const { method = 'GET', url, headers = {}, body, timeout = 30000 } = params;

  if (!url) {
    return { error: 'URL is required' };
  }

  // Security: Block internal URLs
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.match(/192\.168\.\d+\.\d+/)) {
    return { error: 'Internal URLs not allowed', blocked: true };
  }

  try {
    const options = {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'JARVIS/2.0',
        ...headers
      },
      signal: AbortSignal.timeout(timeout)
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
      if (data.length > 10000) {
        data = data.substring(0, 10000) + '... (truncated)';
      }
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data
    };
  } catch (error) {
    return {
      error: error.message,
      url
    };
  }
}

// ============================================================
// Memory Operations (wrapper for MemoryEngine)
// ============================================================
export function createMemoryTool(memoryEngine) {
  return async function memoryOps(params) {
    const { action, query, content, metadata } = params;

    try {
      switch (action) {
        case 'search':
          if (!query) {
            return { error: 'Query is required for search' };
          }
          const results = await memoryEngine.search(query, { limit: 10 });
          return { query, results };

        case 'store':
          if (!content) {
            return { error: 'Content is required for store' };
          }
          const id = await memoryEngine.store(content, metadata);
          return { success: true, id };

        case 'clear':
          memoryEngine.clear();
          return { success: true, message: 'Memory cleared' };

        case 'stats':
          return memoryEngine.getStats();

        default:
          return { error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return { error: error.message };
    }
  };
}

// ============================================================
// Code Execution (JavaScript only, sandboxed)
// ============================================================
export async function codeExecution(params) {
  const { language, code, timeout = 5000 } = params;

  if (!code) {
    return { error: 'Code is required' };
  }

  // Only support JavaScript for now
  if (language !== 'javascript' && language !== 'js') {
    return {
      error: `Language '${language}' not supported. Supported: javascript`,
      supported: ['javascript', 'js']
    };
  }

  try {
    // Output capture array - MUST be defined before sandbox
    const output = [];

    // Create a sandboxed context
    const sandbox = {
      console: {
        log: (...args) => { output.push(args.map(String).join(' ')); },
        error: (...args) => { output.push('[ERROR] ' + args.map(String).join(' ')); },
        warn: (...args) => { output.push('[WARN] ' + args.map(String).join(' ')); }
      },
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Error,
      setTimeout: undefined, // Blocked
      setInterval: undefined, // Blocked
      fetch: undefined, // Blocked
      require: undefined, // Blocked
      process: undefined, // Blocked
      __dirname: undefined,
      __filename: undefined
    };

    // Wrap code to capture return value
    const wrappedCode = `(function() { ${code} })()`;

    // Execute with timeout
    const fn = new Function(...Object.keys(sandbox), `return ${wrappedCode}`);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Execution timeout')), timeout)
    );

    const execPromise = Promise.resolve().then(() => fn(...Object.values(sandbox)));

    const result = await Promise.race([execPromise, timeoutPromise]);

    return {
      success: true,
      output: output.join('\n'),
      result: result !== undefined ? String(result) : undefined,
      language
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      language
    };
  }
}

// ============================================================
// URL Shortener (using is.gd free API)
// ============================================================
export async function urlShorten(params) {
  const { url } = params;

  if (!url) {
    return { error: 'URL is required' };
  }

  try {
    const encoded = encodeURIComponent(url);
    const response = await fetch(
      `https://is.gd/create.php?format=json&url=${encoded}`,
      { signal: AbortSignal.timeout(10000) }
    );

    const data = await response.json();

    if (data.shorturl) {
      return {
        original: url,
        shortened: data.shorturl
      };
    }

    return { error: data.errormessage || 'Failed to shorten URL', url };
  } catch (error) {
    return { error: error.message, url };
  }
}

// ============================================================
// Export all tool implementations
// ============================================================

// Legacy tools (kept for backward compatibility)
const legacyTools = {
  'web-search': webSearch,
  'web-fetch': webFetch,
  'weather': weather,
  'file': fileOps,
  'api': apiRequest,
  'code': codeExecution,
  'shorten': urlShorten
};

// Merge with new modular tools
export const toolImplementations = {
  ...legacyTools,
  ...modularTools
};

// Export registry for advanced usage
export { registry, editHistory, hasCommand };

// Smart tool router - auto-detects intent and calls appropriate tool
export async function smartToolCall(query, tools) {
  const intent = detectIntent(query);

  if (!intent) {
    return null; // No specific tool intent detected
  }

  if (intent.tool === 'direct') {
    return { response: intent.response, source: 'direct' };
  }

  const toolFn = toolImplementations[intent.tool];
  if (!toolFn) {
    return null;
  }

  const result = await toolFn(intent.params || { query });
  return {
    tool: intent.tool,
    params: intent.params,
    result,
    source: 'auto-detect'
  };
}

export default toolImplementations;
