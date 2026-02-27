// Browser Automation Tool
// Playwright-based browser automation for JARVIS
// OpenClaw-compatible web automation capabilities

let playwright = null;
let browser = null;
let context = null;
let lastActivity = Date.now();

// Constants
const MAX_OUTPUT_SIZE = 100000;  // 100KB max content
const DEFAULT_TIMEOUT = 30000;
const IDLE_TIMEOUT = 300000;    // 5 min idle → close browser
const MAX_PAGES = 5;

// Blocked URLs for security
const BLOCKED_URL_PATTERNS = [
  /^file:\/\//i,
  /^chrome:/i,
  /^about:/i,
  /localhost.*:22/i,         // SSH
  /169\.254\.\d+\.\d+/i,     // Link-local
  /192\.168\.\d+\.\d+:\d{1,4}$/i,  // Internal ports < 10000
];

function isUrlAllowed(url) {
  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (pattern.test(url)) {
      return { allowed: false, reason: `URL blocked: ${pattern.toString()}` };
    }
  }
  return { allowed: true };
}

// Auto-cleanup idle browser
setInterval(() => {
  if (browser && Date.now() - lastActivity > IDLE_TIMEOUT) {
    console.log('[browser] Closing idle browser');
    browser.close().catch(() => {});
    browser = null;
    context = null;
  }
}, 60000);

// Lazy load playwright
async function getPlaywright() {
  if (!playwright) {
    try {
      playwright = await import('playwright');
    } catch (error) {
      throw new Error('Playwright not installed. Run: npm install playwright && npx playwright install chromium');
    }
  }
  return playwright;
}

// Get or create browser instance
async function getBrowser(options = {}) {
  lastActivity = Date.now();

  if (!browser || !browser.isConnected()) {
    const pw = await getPlaywright();
    const browserType = options.browser || 'chromium';

    if (!pw[browserType]) {
      throw new Error(`Invalid browser type: ${browserType}. Use: chromium, firefox, webkit`);
    }

    try {
      browser = await pw[browserType].launch({
        headless: options.headless !== false,
        args: options.args || ['--no-sandbox', '--disable-dev-shm-usage']
      });
    } catch (error) {
      throw new Error(`Failed to launch browser: ${error.message}. Run: npx playwright install ${browserType}`);
    }
  }
  return browser;
}

// Get or create browser context
async function getContext(options = {}) {
  lastActivity = Date.now();

  if (!context || context.pages().length === 0) {
    const b = await getBrowser(options);

    // Close existing context if too many pages
    if (context) {
      const pages = context.pages();
      if (pages.length >= MAX_PAGES) {
        await pages[0].close();
      }
    } else {
      context = await b.newContext({
        viewport: options.viewport || { width: 1280, height: 720 },
        userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JARVIS/1.0',
        ignoreHTTPSErrors: false,
        javaScriptEnabled: true,
        ...options.contextOptions
      });

      // Set default timeout for all operations
      context.setDefaultTimeout(DEFAULT_TIMEOUT);
    }
  }
  return context;
}

// Helper to get active page
async function getActivePage(ctx) {
  const pages = ctx.pages();
  if (pages.length === 0) {
    return await ctx.newPage();
  }
  return pages[pages.length - 1];
}

// Truncate content if too large
function truncateContent(content, maxSize = MAX_OUTPUT_SIZE) {
  if (content.length > maxSize) {
    return content.substring(0, maxSize) + '\n... (truncated, ' + content.length + ' total chars)';
  }
  return content;
}

// ============================================================
// Browser Tools
// ============================================================

export const browserTools = {
  // Navigate to URL
  'browser-navigate': {
    name: 'browser-navigate',
    description: 'Navigate to a URL and optionally wait for page load',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' },
        waitUntil: {
          type: 'string',
          enum: ['load', 'domcontentloaded', 'networkidle'],
          default: 'load'
        },
        timeout: { type: 'number', default: 30000 }
      },
      required: ['url']
    },
    execute: async (params) => {
      const { url, waitUntil = 'load', timeout = DEFAULT_TIMEOUT } = params;

      // Validate URL
      if (!url) {
        return { success: false, error: 'URL is required' };
      }

      // Add protocol if missing
      let normalizedUrl = url;
      if (!url.match(/^https?:\/\//i)) {
        normalizedUrl = 'https://' + url;
      }

      // Security check
      const urlCheck = isUrlAllowed(normalizedUrl);
      if (!urlCheck.allowed) {
        return { success: false, error: urlCheck.reason, blocked: true };
      }

      try {
        const ctx = await getContext();
        const page = await getActivePage(ctx);

        const response = await page.goto(normalizedUrl, {
          waitUntil,
          timeout: Math.min(timeout, 60000)  // Cap at 60s
        });

        return {
          success: true,
          url: page.url(),
          status: response?.status(),
          title: await page.title(),
          pageCount: ctx.pages().length
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          hint: error.message.includes('net::') ? 'Network error - check URL or connectivity' : undefined
        };
      }
    }
  },

  // Take screenshot
  'browser-screenshot': {
    name: 'browser-screenshot',
    description: 'Take a screenshot of the current page or element',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to save screenshot' },
        selector: { type: 'string', description: 'CSS selector for element screenshot' },
        fullPage: { type: 'boolean', default: false }
      },
      required: ['path']
    },
    execute: async (params) => {
      const { path, selector, fullPage = false } = params;

      const ctx = await getContext();
      const pages = ctx.pages();
      const page = pages[pages.length - 1];

      if (!page) {
        return { success: false, error: 'No active page. Navigate first.' };
      }

      try {
        if (selector) {
          const element = await page.$(selector);
          if (!element) {
            return { success: false, error: `Element not found: ${selector}` };
          }
          await element.screenshot({ path });
        } else {
          await page.screenshot({ path, fullPage });
        }

        return { success: true, path };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Click element
  'browser-click': {
    name: 'browser-click',
    description: 'Click an element on the page',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for element to click' },
        button: { type: 'string', enum: ['left', 'right', 'middle'], default: 'left' },
        clickCount: { type: 'number', default: 1 },
        timeout: { type: 'number', default: 30000 }
      },
      required: ['selector']
    },
    execute: async (params) => {
      const { selector, button = 'left', clickCount = 1, timeout = 30000 } = params;

      const ctx = await getContext();
      const pages = ctx.pages();
      const page = pages[pages.length - 1];

      if (!page) {
        return { success: false, error: 'No active page' };
      }

      try {
        await page.click(selector, { button, clickCount, timeout });
        return { success: true, selector };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Type text
  'browser-type': {
    name: 'browser-type',
    description: 'Type text into an input element',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector for input element' },
        text: { type: 'string', description: 'Text to type' },
        delay: { type: 'number', description: 'Delay between keystrokes (ms)', default: 0 },
        clear: { type: 'boolean', description: 'Clear existing text first', default: false }
      },
      required: ['selector', 'text']
    },
    execute: async (params) => {
      const { selector, text, delay = 0, clear = false } = params;

      const ctx = await getContext();
      const pages = ctx.pages();
      const page = pages[pages.length - 1];

      if (!page) {
        return { success: false, error: 'No active page' };
      }

      try {
        if (clear) {
          await page.fill(selector, '');
        }
        await page.type(selector, text, { delay });
        return { success: true, selector, textLength: text.length };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Get page content
  'browser-content': {
    name: 'browser-content',
    description: 'Get page content (HTML or text)',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector (optional, gets full page if omitted)' },
        format: { type: 'string', enum: ['html', 'text'], default: 'text' },
        timeout: { type: 'number', default: 10000 }
      }
    },
    execute: async (params) => {
      const { selector, format = 'text', timeout = 10000 } = params;

      try {
        const ctx = await getContext();
        const page = await getActivePage(ctx);

        if (!page.url() || page.url() === 'about:blank') {
          return { success: false, error: 'No page loaded. Use browser-navigate first.' };
        }

        let content;
        const originalLength = { value: 0 };

        if (selector) {
          let element = await page.$(selector);
          if (!element) {
            // Try waiting briefly
            try {
              await page.waitForSelector(selector, { timeout: Math.min(timeout, 5000) });
              element = await page.$(selector);
            } catch {
              return {
                success: false,
                error: `Element not found: ${selector}`,
                hint: 'Check selector syntax or wait for page load'
              };
            }
          }
          content = format === 'html'
            ? await element.innerHTML()
            : await element.innerText();
        } else {
          content = format === 'html'
            ? await page.content()
            : await page.innerText('body').catch(() => page.content());
        }

        originalLength.value = content.length;
        content = truncateContent(content);

        return {
          success: true,
          content,
          length: content.length,
          originalLength: originalLength.value,
          truncated: originalLength.value > MAX_OUTPUT_SIZE,
          url: page.url()
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Wait for element
  'browser-wait': {
    name: 'browser-wait',
    description: 'Wait for an element to appear or condition',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to wait for' },
        state: {
          type: 'string',
          enum: ['attached', 'detached', 'visible', 'hidden'],
          default: 'visible'
        },
        timeout: { type: 'number', default: 30000 }
      },
      required: ['selector']
    },
    execute: async (params) => {
      const { selector, state = 'visible', timeout = 30000 } = params;

      const ctx = await getContext();
      const pages = ctx.pages();
      const page = pages[pages.length - 1];

      if (!page) {
        return { success: false, error: 'No active page' };
      }

      try {
        await page.waitForSelector(selector, { state, timeout });
        return { success: true, selector, state };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Evaluate JavaScript
  'browser-evaluate': {
    name: 'browser-evaluate',
    description: 'Execute JavaScript in the browser context',
    parameters: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'JavaScript code to execute' }
      },
      required: ['script']
    },
    execute: async (params) => {
      const { script } = params;

      const ctx = await getContext();
      const pages = ctx.pages();
      const page = pages[pages.length - 1];

      if (!page) {
        return { success: false, error: 'No active page' };
      }

      try {
        const result = await page.evaluate(script);
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Get all links
  'browser-links': {
    name: 'browser-links',
    description: 'Extract all links from the current page',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Scope selector (optional)', default: 'body' }
      }
    },
    execute: async (params) => {
      const { selector = 'body' } = params;

      const ctx = await getContext();
      const pages = ctx.pages();
      const page = pages[pages.length - 1];

      if (!page) {
        return { success: false, error: 'No active page' };
      }

      try {
        const links = await page.$$eval(`${selector} a[href]`, (elements) =>
          elements.map(el => ({
            text: el.innerText.trim().substring(0, 100),
            href: el.href
          }))
        );

        return { success: true, links, count: links.length };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Fill form
  'browser-fill-form': {
    name: 'browser-fill-form',
    description: 'Fill multiple form fields at once',
    parameters: {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              selector: { type: 'string' },
              value: { type: 'string' }
            }
          },
          description: 'Array of {selector, value} pairs'
        }
      },
      required: ['fields']
    },
    execute: async (params) => {
      const { fields } = params;

      const ctx = await getContext();
      const pages = ctx.pages();
      const page = pages[pages.length - 1];

      if (!page) {
        return { success: false, error: 'No active page' };
      }

      try {
        const results = [];

        for (const { selector, value } of fields) {
          try {
            await page.fill(selector, value);
            results.push({ selector, success: true });
          } catch (e) {
            results.push({ selector, success: false, error: e.message });
          }
        }

        return { success: true, results };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Close browser
  'browser-close': {
    name: 'browser-close',
    description: 'Close browser and clean up resources',
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      try {
        if (context) {
          await context.close();
          context = null;
        }
        if (browser) {
          await browser.close();
          browser = null;
        }
        return { success: true, message: 'Browser closed' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }
};

// Export tool list for registration
export function getBrowserTools() {
  return Object.values(browserTools);
}

// Export individual tool executor
export async function executeBrowserTool(toolName, params) {
  const tool = browserTools[toolName];
  if (!tool) {
    return { success: false, error: `Unknown browser tool: ${toolName}` };
  }
  return await tool.execute(params);
}

export default browserTools;
