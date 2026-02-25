'use client'

import { useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'

// Documentation content
const docsContent: Record<string, { title: string; content: React.ReactNode }> = {
  'index': {
    title: 'Documentation',
    content: <IntroductionContent />
  },
  'quickstart': {
    title: 'Quick Start Guide',
    content: <QuickstartContent />
  },
  'install': {
    title: 'Installation',
    content: <InstallContent />
  },
  'requirements': {
    title: 'System Requirements',
    content: <RequirementsContent />
  },
  'architecture': {
    title: '3-Agent Architecture',
    content: <ArchitectureContent />
  },
  'memory': {
    title: 'Memory Management',
    content: <MemoryContent />
  },
  'routing': {
    title: 'Smart Routing',
    content: <RoutingContent />
  },
  'claude-bridge': {
    title: 'Claude Bridge',
    content: <ClaudeBridgeContent />
  },
  'api': {
    title: 'API Reference',
    content: <ApiOverviewContent />
  },
  'api/agent-router': {
    title: 'AgentRouter',
    content: <AgentRouterApiContent />
  },
  'faq': {
    title: 'Frequently Asked Questions',
    content: <FaqContent />
  },
}

interface DocsContentProps {
  slug: string
}

export function DocsContent({ slug }: DocsContentProps) {
  const doc = docsContent[slug] || docsContent['index']

  useEffect(() => {
    // Scroll to top when slug changes
    window.scrollTo(0, 0)
  }, [slug])

  return (
    <article className="prose prose-invert prose-lg max-w-none">
      <h1 className="text-4xl font-bold text-white mb-8">{doc.title}</h1>
      {doc.content}
    </article>
  )
}

// Content Components
function IntroductionContent() {
  return (
    <div className="space-y-6 text-[#A0A0B0]">
      <p className="text-xl leading-relaxed">
        Welcome to <strong className="text-white">MyLittleJarvis</strong> documentation. 
        Transform your old smartphone into a powerful AI assistant with Claude Code-level 
        capabilities at a fraction of the cost.
      </p>

      <div className="grid md:grid-cols-3 gap-4 my-8">
        <Card 
          icon="🚀" 
          title="Quick Start" 
          description="Get up and running in 15 minutes with our one-click installer."
          href="/docs/quickstart"
        />
        <Card 
          icon="📖" 
          title="API Reference" 
          description="Complete API documentation for all core components."
          href="/docs/api"
        />
        <Card 
          icon="💡" 
          title="Examples" 
          description="Learn by example with real-world use cases."
          href="/docs/examples"
        />
      </div>

      <h2 className="text-2xl font-semibold text-white mt-12 mb-4">What is MyLittleJarvis?</h2>
      <p>
        MyLittleJarvis is a <strong className="text-white">3-Agent Hybrid AI system</strong> that runs 
        entirely on your Android device using Termux. It combines local LLMs (Qwen, Phi-3) with 
        optional cloud AI (Claude) to provide intelligent assistance without compromising privacy.
      </p>

      <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Key Features</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li><strong className="text-white">3-Agent Architecture</strong> - Orchestrator, Assistant, and Claude Bridge</li>
        <li><strong className="text-white">Smart Memory Management</strong> - LRU-based with context compression</li>
        <li><strong className="text-white">Cost Efficient</strong> - 85% cost reduction vs direct API usage</li>
        <li><strong className="text-white">Privacy First</strong> - Local processing, no data sent to cloud unless requested</li>
        <li><strong className="text-white">Extensible</strong> - Plugin system for custom functionality</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white mt-12 mb-4">Next Steps</h2>
      <p>
        Ready to get started? Head over to the <a href="/docs/quickstart" className="text-[#00D4AA] hover:underline">Quick Start Guide</a> 
        or learn about <a href="/docs/install" className="text-[#00D4AA] hover:underline">Installation</a> options.
      </p>
    </div>
  )
}

function QuickstartContent() {
  return (
    <div className="space-y-6 text-[#A0A0B0]">
      <p className="text-xl">
        Get MyLittleJarvis running in <strong className="text-white">15 minutes</strong> with our 
        streamlined setup process.
      </p>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Prerequisites</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li>Android 10+ device (Galaxy Note 20 Ultra or similar recommended)</li>
        <li>12GB RAM (8GB minimum with smaller models)</li>
        <li>10GB free storage</li>
        <li>Termux app from F-Droid</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Step 1: One-Click Install</h2>
      <CodeBlock language="bash">
        {`curl -fsSL https://jarvis.dev/install.sh | bash`}
      </CodeBlock>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Step 2: Configure</h2>
      <p>Edit the <code className="bg-[#1A1A24] px-2 py-1 rounded text-[#00D4AA]">.env</code> file with your settings:</p>
      <CodeBlock language="bash">
        {`cd ~/jarvis-agent-v2
cp .env.example .env
nano .env`}
      </CodeBlock>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Step 3: Start JARVIS</h2>
      <CodeBlock language="bash">
        {`npm start`}
      </CodeBlock>

      <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-[#00D4AA] mb-2">🎉 Success!</h3>
        <p>
          Open Telegram and start chatting with your bot. Try saying "Hello!" or 
          ask it to help with a coding task.
        </p>
      </div>
    </div>
  )
}

function InstallContent() {
  return (
    <div className="space-y-6 text-[#A0A0B0]">
      <p className="text-xl">
        Detailed installation instructions for various methods.
      </p>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Method 1: One-Click Installer (Recommended)</h2>
      <p>The easiest way to install on Termux:</p>
      <CodeBlock language="bash">
        {`curl -fsSL https://jarvis.dev/install.sh | bash`}
      </CodeBlock>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Method 2: Manual Installation</h2>
      <CodeBlock language="bash">
        {`# 1. Install dependencies
pkg update && pkg install -y nodejs git curl

# 2. Clone repository
git clone https://github.com/mylittlejarvis/jarvis-agent-v2.git
cd jarvis-agent-v2

# 3. Install npm dependencies
npm install

# 4. Setup environment
npm run setup

# 5. Download models
ollama pull qwen2.5:1.5b
ollama pull phi3:mini

# 6. Start
npm start`}
      </CodeBlock>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Method 3: Docker</h2>
      <p>For advanced users:</p>
      <CodeBlock language="bash">
        {`docker run -d \\
  --name jarvis \\
  -v $(pwd)/.env:/app/.env \\
  mylittlejarvis/jarvis-agent-v2`}
      </CodeBlock>
    </div>
  )
}

function RequirementsContent() {
  return (
    <div className="space-y-6 text-[#A0A0B0]">
      <h2 className="text-2xl font-semibold text-white mb-4">Hardware Requirements</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1A1A24]">
              <th className="py-3 px-4 text-white">Component</th>
              <th className="py-3 px-4 text-white">Minimum</th>
              <th className="py-3 px-4 text-white">Recommended</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#1A1A24]">
              <td className="py-3 px-4">Android Version</td>
              <td className="py-3 px-4">10 (API 29)</td>
              <td className="py-3 px-4">13+ (API 33)</td>
            </tr>
            <tr className="border-b border-[#1A1A24]">
              <td className="py-3 px-4">RAM</td>
              <td className="py-3 px-4">8GB</td>
              <td className="py-3 px-4">12GB+</td>
            </tr>
            <tr className="border-b border-[#1A1A24]">
              <td className="py-3 px-4">Storage</td>
              <td className="py-3 px-4">10GB free</td>
              <td className="py-3 px-4">20GB free</td>
            </tr>
            <tr className="border-b border-[#1A1A24]">
              <td className="py-3 px-4">Processor</td>
              <td className="py-3 px-4">ARM64</td>
              <td className="py-3 px-4">Snapdragon 865+ / Exynos 990</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Software Requirements</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li>Termux 0.118+ (from F-Droid, NOT Play Store)</li>
        <li>Node.js 22.0.0+</li>
        <li>Ollama (for local LLM inference)</li>
        <li>Git (for auto-commit feature)</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Tested Devices</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <DeviceCard name="Galaxy Note 20 Ultra" status="✅ Excellent" ram="12GB" />
        <DeviceCard name="Galaxy S21 Ultra" status="✅ Excellent" ram="12/16GB" />
        <DeviceCard name="Galaxy S20 Ultra" status="✅ Good" ram="12GB" />
        <DeviceCard name="Pixel 7 Pro" status="⚠️ Limited" ram="8GB" />
      </div>
    </div>
  )
}

function ArchitectureContent() {
  return (
    <div className="space-y-6 text-[#A0A0B0]">
      <p className="text-xl">
        MyLittleJarvis uses a unique <strong className="text-white">3-Agent Hybrid Architecture</strong> 
        that balances performance, cost, and quality.
      </p>

      <div className="bg-[#12121A] border border-[#1A1A24] rounded-xl p-6 my-8">
        <pre className="text-sm text-[#A0A0B0] font-mono">
{`User Request
     │
     ▼
┌─────────────────┐
│  AgentRouter    │ ← Decides which agent handles the request
│  (Orchestrator) │
└─────────────────┘
     │
     ├──────────┬──────────┐
     ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌─────────────┐
│  Local │ │ Local  │ │    Cloud    │
│  Fast  │ │  Deep  │ │   (Claude)  │
│ (Qwen) │ │ (Phi3) │ │   Optional  │
└────────┘ └────────┘ └─────────────┘`}
        </pre>
      </div>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Agent 1: Orchestrator (Qwen 2.5 1.5B)</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li><strong className="text-white">Always Resident</strong> - Loaded at startup, never unloaded</li>
        <li><strong className="text-white">Routing Decisions</strong> - Analyzes requests and routes to appropriate agent</li>
        <li><strong className="text-white">Quick Responses</strong> - Handles simple queries in &lt; 0.5s</li>
        <li><strong className="text-white">Memory</strong> - Uses ~1.3GB RAM</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Agent 2: Assistant (Phi-3 Mini 3.8B)</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li><strong className="text-white">On-Demand</strong> - Loaded when needed, LRU eviction after 5min idle</li>
        <li><strong className="text-white">Deep Analysis</strong> - Code explanation, structured data extraction</li>
        <li><strong className="text-white">Better Reasoning</strong> - More capable than Orchestrator</li>
        <li><strong className="text-white">Memory</strong> - Uses ~2.8GB RAM when loaded</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Agent 3: Claude Bridge (API)</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li><strong className="text-white">Optional</strong> - Requires Anthropic API key</li>
        <li><strong className="text-white">Complex Tasks</strong> - Refactoring, debugging, architecture</li>
        <li><strong className="text-white">Best Quality</strong> - Claude 3.5 Sonnet level intelligence</li>
        <li><strong className="text-white">Cost</strong> - Only used for complex tasks, 85% cost savings</li>
      </ul>
    </div>
  )
}

function MemoryContent() {
  return (
    <div className="space-y-6 text-[#A0A0B0]">
      <p className="text-xl">
        Smart memory management ensures optimal performance on resource-constrained devices.
      </p>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">LRU Eviction Strategy</h2>
      <CodeBlock language="javascript">
        {`// Memory budget: 8.5GB on Note 20 Ultra
const MEMORY_BUDGET = 8.5 * 1024 * 1024 * 1024;

// Model memory requirements
const MODEL_MEMORY = {
  'qwen2.5:1.5b': 1.3 * GB,  // Always resident
  'phi3:mini': 2.8 * GB,      // LRU eviction after 5min
  'qwen2.5:7b': 5.5 * GB,     // Fallback only
};`}
      </CodeBlock>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Context Compression</h2>
      <p>
        When conversation history exceeds the model's context window, older messages are 
        automatically compressed using rule-based summarization.
      </p>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Context Windows</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li><strong className="text-white">Orchestrator (Qwen 1.5B)</strong>: 4K tokens</li>
        <li><strong className="text-white">Assistant (Phi-3)</strong>: 2K tokens (limited for speed)</li>
        <li><strong className="text-white">Claude Bridge</strong>: 8K tokens</li>
      </ul>
    </div>
  )
}

function RoutingContent() {
  return (
    <div className="space-y-6 text-[#A0A0B0]">
      <p className="text-xl">
        The <strong className="text-white">AgentRouter</strong> intelligently decides which agent 
        should handle each request.
      </p>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Routing Logic</h2>
      
      <div className="space-y-4">
        <div className="bg-[#12121A] border border-[#00D4AA]/30 rounded-lg p-4">
          <h3 className="text-[#00D4AA] font-semibold mb-2">1. Quick Pattern Matching</h3>
          <p className="text-sm">Instant routing for common patterns (greetings, simple queries)</p>
        </div>

        <div className="bg-[#12121A] border border-[#00B4D8]/30 rounded-lg p-4">
          <h3 className="text-[#00B4D8] font-semibold mb-2">2. Complexity Analysis</h3>
          <p className="text-sm">Orchestrator analyzes unclear requests using LLM</p>
        </div>

        <div className="bg-[#12121A] border border-[#7C3AED]/30 rounded-lg p-4">
          <h3 className="text-[#7C3AED] font-semibold mb-2">3. Fallback Chain</h3>
          <p className="text-sm">If primary agent fails, fallback to next available</p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Routing Categories</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#1A1A24]">
            <th className="py-2 text-white">Category</th>
            <th className="py-2 text-white">Examples</th>
            <th className="py-2 text-white">Agent</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#1A1A24]">
            <td className="py-2">Local Only</td>
            <td className="py-2">"Hello", "What time is it?"</td>
            <td className="py-2 text-[#00D4AA]">Orchestrator</td>
          </tr>
          <tr className="border-b border-[#1A1A24]">
            <td className="py-2">Local Preferred</td>
            <td className="py-2">"Explain this code", "Rename variables"</td>
            <td className="py-2 text-[#00B4D8]">Assistant</td>
          </tr>
          <tr className="border-b border-[#1A1A24]">
            <td className="py-2">Cloud Required</td>
            <td className="py-2">"Refactor module", "Debug this"</td>
            <td className="py-2 text-[#7C3AED]">Claude Bridge</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function ClaudeBridgeContent() {
  return (
    <div className="space-y-6 text-[#A0A0B0]">
      <p className="text-xl">
        The <strong className="text-white">Claude Bridge</strong> provides access to 
        Claude 3.5 Sonnet for complex coding tasks while maintaining cost efficiency.
      </p>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Configuration</h2>
      <CodeBlock language="bash">
        {`# Add to .env
CLAUDE_API_KEY=sk-ant-your-api-key
CLAUDE_MODEL=claude-3-5-sonnet-20241022`}
      </CodeBlock>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Rate Limiting</h2>
      <p>
        Built-in rate limiting ensures you stay within Anthropic's limits:
      </p>
      <ul className="space-y-2 list-disc list-inside">
        <li><strong className="text-white">50 requests/minute</strong> - Sliding window algorithm</li>
        <li><strong className="text-white">Automatic backoff</strong> - Retries with exponential delay</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Cost Optimization</h2>
      <div className="bg-[#12121A] border border-[#00D4AA]/30 rounded-lg p-6">
        <h3 className="text-[#00D4AA] font-semibold mb-2">💰 Smart Routing Saves Money</h3>
        <p className="text-sm mb-4">
          Only complex tasks are sent to Claude. Simple queries are handled by local agents.
        </p>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-[#0A0A0F] rounded-lg p-4">
            <div className="text-2xl font-bold text-white">$15</div>
            <div className="text-sm text-[#6A6A80]">Direct API (1M tokens)</div>
          </div>
          <div className="bg-[#00D4AA]/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-[#00D4AA]">$2.25</div>
            <div className="text-sm text-[#6A6A80]">JARVIS (1M tokens)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApiOverviewContent() {
  return (
    <div className="space-y-6 text-[#A0A0B0]">
      <p className="text-xl">
        Complete API reference for all core components.
      </p>

      <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Core Classes</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <ApiCard 
          title="AgentRouter" 
          description="Routes requests to appropriate agents"
          href="/docs/api/agent-router"
        />
        <ApiCard 
          title="MultiOllamaClient" 
          description="Manages multiple local LLM models"
          href="/docs/api/multi-ollama"
        />
        <ApiCard 
          title="SmartMemoryManager" 
          description="Context and memory management"
          href="/docs/api/memory-manager"
        />
        <ApiCard 
          title="ClaudeBridge" 
          description="Cloud AI integration"
          href="/docs/api/claude-bridge"
        />
      </div>
    </div>
  )
}

function AgentRouterApiContent() {
  return (
    <div className="space-y-6 text-[#A0A0B0]">
      <h2 className="text-2xl font-semibold text-white mb-4">AgentRouter</h2>
      
      <CodeBlock language="typescript">
        {`class AgentRouter {
  constructor(
    multiOllama: MultiOllamaClient,
    claudeBridge?: ClaudeBridge
  )

  async route(
    userMessage: string,
    context?: object
  ): Promise<RouteDecision>
}`}
      </CodeBlock>

      <h3 className="text-xl font-semibold text-white mt-6 mb-2">Methods</h3>
      
      <div className="space-y-4">
        <div className="bg-[#12121A] rounded-lg p-4">
          <h4 className="text-[#00D4AA] font-mono mb-2">route(message, context)</h4>
          <p className="text-sm mb-2">Analyzes user message and returns routing decision.</p>
          <p className="text-sm text-[#6A6A80]">Returns: <code className="text-[#00D4AA]">RouteDecision</code></p>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-white mt-6 mb-2">Types</h3>
      <CodeBlock language="typescript">
        {`interface RouteDecision {
  agent: 'orchestrator' | 'assistant' | 'claude';
  model: string;
  confidence: number;
  reason: string;
}`}
      </CodeBlock>
    </div>
  )
}

function FaqContent() {
  return (
    <div className="space-y-6 text-[#A0A0B0]">
      <h2 className="text-2xl font-semibold text-white mb-4">Frequently Asked Questions</h2>

      <div className="space-y-6">
        <FaqItem 
          question="Can I run this on iPhone?"
          answer="Currently, MyLittleJarvis only supports Android devices with Termux. iOS support is not planned due to system limitations."
        />
        <FaqItem 
          question="Do I need an internet connection?"
          answer="No! All local agents (Orchestrator, Assistant) work offline. Only Claude Bridge requires internet, and it's optional."
        />
        <FaqItem 
          question="How much does it cost?"
          answer="The local agents are completely free. If you use Claude Bridge, you'll save ~85% compared to using Claude API directly."
        />
        <FaqItem 
          question="Is my data private?"
          answer="Yes! All processing happens on your device. No data is sent to any server unless you explicitly use Claude Bridge."
        />
        <FaqItem 
          question="What if I run out of memory?"
          answer="The system automatically unloads the least recently used model (except Orchestrator). You can also use smaller models."
        />
        <FaqItem 
          question="Can I use custom LLM models?"
          answer="Yes! You can configure any Ollama-compatible model in the .env file."
        />
      </div>
    </div>
  )
}

// Helper Components
function Card({ icon, title, description, href }: { icon: string; title: string; description: string; href: string }) {
  return (
    <a href={href} className="block bg-[#12121A] border border-[#1A1A24] rounded-xl p-6 hover:border-[#00D4AA]/50 transition-colors group">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#00D4AA] transition-colors">{title}</h3>
      <p className="text-sm text-[#6A6A80]">{description}</p>
    </a>
  )
}

function ApiCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a href={href} className="block bg-[#12121A] border border-[#1A1A24] rounded-lg p-4 hover:border-[#00D4AA]/50 transition-colors">
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-sm text-[#6A6A80]">{description}</p>
    </a>
  )
}

function DeviceCard({ name, status, ram }: { name: string; status: string; ram: string }) {
  return (
    <div className="bg-[#12121A] border border-[#1A1A24] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-medium">{name}</span>
        <span className="text-sm">{status}</span>
      </div>
      <div className="text-sm text-[#6A6A80]">RAM: {ram}</div>
    </div>
  )
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  return (
    <div className="bg-[#0D1117] border border-[#30363D] rounded-lg overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161B22] border-b border-[#30363D]">
        <span className="text-xs text-[#8B949E]">{language}</span>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-[#E2E8F0]">{children}</code>
      </pre>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-[#1A1A24] pb-6">
      <h3 className="text-lg font-semibold text-white mb-2">{question}</h3>
      <p className="text-[#A0A0B0]">{answer}</p>
    </div>
  )
}
