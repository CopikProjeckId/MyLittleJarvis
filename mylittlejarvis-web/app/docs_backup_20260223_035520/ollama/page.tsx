import { getConfig } from '@/lib/server-config'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export const metadata: Metadata = {
  title: 'Ollama Local - MyLittleJarvis Docs',
  description: 'Run local LLMs with Ollama for complete privacy and offline AI capabilities.',
}

const installSteps = [
  {
    label: '1. Install Ollama',
    code: `curl -fsSL https://ollama.com/install.sh | sh`,
  },
  {
    label: '2. Pull a model',
    code: `ollama pull llama3.2
# Or for a smaller model:
ollama pull phi3.5`,
  },
  {
    label: '3. Verify Ollama is running',
    code: `ollama list
# Should show your downloaded models`,
  },
  {
    label: '4. Configure JARVIS to use Ollama',
    code: `# In your .env file:
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
USE_LOCAL_LLM=true`,
  },
  {
    label: '5. Restart JARVIS',
    code: `npm run restart
# JARVIS will now route tasks to your local Ollama instance`,
  },
]

const sections = [
  {
    id: 'overview',
    title: 'Why Ollama?',
    icon: '🦙',
    type: 'list' as const,
    content: [
      'Complete privacy — your data never leaves your device.',
      'Zero API costs after setup — run unlimited queries for free.',
      'Works offline — no internet connection required.',
      'Supports hundreds of open-source models (Llama, Phi, Mistral, Gemma, and more).',
      'Low latency for simple tasks when running on the same local network.',
    ],
  },
  {
    id: 'requirements',
    title: 'Requirements',
    icon: '📋',
    type: 'list' as const,
    content: [
      'A host machine with at least 8GB RAM (16GB recommended for larger models).',
      'macOS, Linux, or Windows (WSL2) — Ollama runs on your PC/server, not your phone.',
      'For GPU acceleration: NVIDIA (CUDA 11.8+) or Apple Silicon.',
      'JARVIS agent version 0.4.0 or higher.',
    ],
  },
  {
    id: 'installation',
    title: 'Installation',
    icon: '⚙️',
    type: 'code' as const,
    content: installSteps,
  },
  {
    id: 'recommended-models',
    title: 'Recommended Models',
    icon: '🧠',
    type: 'table' as const,
    content: [
      { model: 'llama3.2', size: '2GB', useCase: 'General tasks, good balance of speed & quality' },
      { model: 'phi3.5', size: '2.2GB', useCase: 'Fast responses, code generation' },
      { model: 'mistral', size: '4.1GB', useCase: 'Strong reasoning and instruction following' },
      { model: 'llama3.1:8b', size: '4.7GB', useCase: 'Higher quality output, needs 16GB RAM' },
      { model: 'gemma2:2b', size: '1.6GB', useCase: 'Ultra-fast, minimal resource usage' },
    ],
  },
  {
    id: 'routing',
    title: 'How Task Routing Works',
    icon: '🔀',
    type: 'list' as const,
    content: [
      'JARVIS uses a hybrid routing strategy when Ollama is configured.',
      'Simple queries, reminders, and local tasks → Ollama (fast, free, private).',
      'Complex coding, reasoning chains, and Claude Bridge tasks → Anthropic API.',
      'You can force a specific backend per session with /mode local or /mode cloud.',
      'Routing thresholds are tunable in config/routing.json.',
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🔧',
    type: 'list' as const,
    content: [
      'Ollama not found: ensure the install script ran successfully and ollama is in your PATH.',
      'Connection refused: Ollama defaults to port 11434 — check it\'s running with ollama serve.',
      'Slow responses: try a smaller model like phi3.5 or gemma2:2b.',
      'Out of memory: reduce context length in .env with OLLAMA_NUM_CTX=2048.',
      'Model not found: run ollama pull <model-name> before starting JARVIS.',
    ],
  },
]

export default async function OllamaPage() {
  const config = await getConfig()
  const page = config.docs.pages.ollama as {
    title?: string
    icon?: string
    content?: string
  } | undefined
  const sidebar = config.docs.sidebar

  const pageTitle = page?.title ?? 'Ollama Local'
  const pageIcon = page?.icon ?? '🦙'

  return (
    <div className="docs-container font-['Space_Grotesk',sans-serif]">
      <Header config={config} />

      {/* Layout */}
      <div className="docs-layout">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 fixed h-[calc(100vh-72px)] overflow-y-auto border-r border-bg-tertiary py-8 px-4">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            {sidebar.title}
          </p>
          {sidebar.sections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="text-[#606070] text-xs uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const href = item.slug ? `/docs/${item.slug}` : '/docs'
                  const isActive = item.slug === 'ollama'
                  return (
                    <li key={item.slug}>
                      <Link
                        href={href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-[#00D4AA]/10 text-accent-primary'
                            : 'text-text-secondary hover:text-white hover:bg-bg-tertiary'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-8 py-10 max-w-3xl w-full">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[#606070] mb-8">
            <Link href="/docs" className="hover:text-accent-primary transition-colors">Docs</Link>
            <span>/</span>
            <span className="text-text-secondary">Integrations</span>
            <span>/</span>
            <span className="text-white">{pageTitle}</span>
          </nav>

          {/* Page title */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{pageIcon}</span>
              <h1 className="text-3xl font-bold text-white tracking-tight">{pageTitle}</h1>
            </div>
            <p className="text-text-secondary text-lg leading-relaxed">
              Run open-source LLMs locally with Ollama for complete privacy, zero API costs, and offline AI capabilities.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#00D4AA]/10 text-accent-primary border border-[#00D4AA]/20 rounded-full px-3 py-1">
                🔒 100% Private
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-secondary border border-[#2A2A34] rounded-full px-3 py-1">
                💰 Zero API Cost
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-secondary border border-[#2A2A34] rounded-full px-3 py-1">
                📡 Works Offline
              </span>
            </div>
          </div>

          {/* Content sections */}
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </h2>

                {section.type === 'list' && (
                  <ul className="space-y-2">
                    {(section.content as string[]).map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-[#C0C0D0]">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#00D4AA] flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.type === 'code' && (
                  <div className="space-y-4">
                    {(section.content as typeof installSteps).map((step, i) => (
                      <div key={i}>
                        <p className="text-sm text-text-secondary mb-2 font-medium">{step.label}</p>
                        <div className="relative rounded-xl overflow-hidden border border-bg-tertiary bg-[#0D0D15]">
                          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-bg-tertiary bg-[#111118]">
                            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
                            <span className="ml-2 text-xs text-[#606070]">bash</span>
                          </div>
                          <pre className="px-5 py-4 overflow-x-auto text-sm leading-relaxed">
                            <code className="text-accent-primary font-mono">{step.code}</code>
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {section.type === 'table' && (
                  <div className="rounded-xl border border-bg-tertiary overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#111118] border-b border-bg-tertiary">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#606070] uppercase tracking-wider">Model</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#606070] uppercase tracking-wider">Size</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#606070] uppercase tracking-wider">Best For</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1A24]">
                        {(section.content as { model: string; size: string; useCase: string }[]).map((row, i) => (
                          <tr key={i} className="bg-[#0D0D15] hover:bg-[#111118] transition-colors">
                            <td className="px-4 py-3 font-mono text-accent-primary">{row.model}</td>
                            <td className="px-4 py-3 text-text-secondary">{row.size}</td>
                            <td className="px-4 py-3 text-[#C0C0D0]">{row.useCase}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Next / Prev navigation */}
          <div className="mt-14 pt-8 border-t border-bg-tertiary grid grid-cols-2 gap-4">
            <Link
              href="/docs/claude-bridge"
              className="group flex flex-col p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">← Previous</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                🌉 Claude Bridge
              </span>
            </Link>
            <Link
              href="/docs/telegram"
              className="group flex flex-col items-end p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">Next →</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                ✈️ Telegram Bot
              </span>
            </Link>
          </div>

        </main>
      </div>
      <Footer config={config} />
    </div>
  )
}
