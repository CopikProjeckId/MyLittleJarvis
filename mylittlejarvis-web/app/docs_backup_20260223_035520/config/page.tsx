import { getConfig } from '@/lib/server-config'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export const metadata: Metadata = {
  title: 'Configuration - MyLittleJarvis Docs',
  description: 'Complete configuration reference for MyLittleJarvis.',
}

const configSections = [
  {
    id: 'env-vars',
    title: 'Environment Variables',
    icon: '🔑',
    type: 'table' as const,
    rows: [
      { key: 'ANTHROPIC_API_KEY', required: true, desc: 'Your Anthropic API key for Claude access' },
      { key: 'TELEGRAM_BOT_TOKEN', required: false, desc: 'Telegram bot token for chat interface' },
      { key: 'JARVIS_PORT', required: false, desc: 'HTTP port to listen on (default: 3000)' },
      { key: 'OLLAMA_HOST', required: false, desc: 'Ollama endpoint (default: http://localhost:11434)' },
      { key: 'MEMORY_MAX_TOKENS', required: false, desc: 'Max tokens kept in memory context (default: 8192)' },
      { key: 'LOG_LEVEL', required: false, desc: 'Logging verbosity: debug | info | warn | error' },
    ],
  },
  {
    id: 'config-file',
    title: 'Config File (jarvis.config.json)',
    icon: '📄',
    type: 'code' as const,
    code: `{
  "persona": "default",
  "routing": {
    "strategy": "smart",
    "fallback": "claude"
  },
  "memory": {
    "maxTokens": 8192,
    "persistence": true,
    "storagePath": "./.jarvis/memory"
  },
  "ollama": {
    "host": "http://localhost:11434",
    "models": ["llama3", "mistral"]
  },
  "plugins": [],
  "batchMode": false
}`,
  },
  {
    id: 'routing',
    title: 'Routing Strategies',
    icon: '🔀',
    type: 'list' as const,
    content: [
      '**smart** — Automatically selects the best agent based on task type and complexity (recommended)',
      '**local-first** — Prefers local Ollama models, falls back to Claude for complex tasks',
      '**claude-only** — Routes all requests to Claude (highest quality, uses API credits)',
      '**ollama-only** — Forces local models only; fails if Ollama is unavailable',
    ],
  },
  {
    id: 'personas',
    title: 'Persona Configuration',
    icon: '🎭',
    type: 'code' as const,
    code: `// .jarvis/personas/custom.json
{
  "name": "custom",
  "systemPrompt": "You are a focused coding assistant...",
  "temperature": 0.3,
  "preferredModel": "claude",
  "tools": ["code", "search", "memory"]
}`,
  },
  {
    id: 'memory',
    title: 'Memory Settings',
    icon: '🧠',
    type: 'list' as const,
    content: [
      '**maxTokens** — Controls how much conversation history is kept in context',
      '**persistence** — When true, memory survives restarts (stored on disk)',
      '**storagePath** — Directory for persisted memory files (relative to project root)',
      'Use `jarvis memory clear` to wipe stored memory at any time',
    ],
  },
]

export default async function ConfigPage() {
  const config = await getConfig()
  const page = config.docs.pages.config as {
    title?: string
    icon?: string
  } | undefined
  const sidebar = config.docs.sidebar

  const pageTitle = page?.title ?? 'Configuration'
  const pageIcon = page?.icon ?? '⚙️'

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
                  const isActive = item.slug === 'config'
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
            <span className="text-text-secondary">Getting Started</span>
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
              Full reference for environment variables, config files, routing strategies, and personas.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#00D4AA]/10 text-accent-primary border border-[#00D4AA]/20 rounded-full px-3 py-1">
                📄 jarvis.config.json
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-secondary border border-[#2A2A34] rounded-full px-3 py-1">
                🔑 .env file
              </span>
            </div>
          </div>

          {/* Content sections */}
          <div className="space-y-10">
            {configSections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </h2>

                {section.type === 'table' && (
                  <div className="rounded-xl border border-bg-tertiary overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#111118] border-b border-bg-tertiary">
                          <th className="text-left px-4 py-3 text-[#606070] font-medium uppercase tracking-wider text-xs">Variable</th>
                          <th className="text-left px-4 py-3 text-[#606070] font-medium uppercase tracking-wider text-xs">Required</th>
                          <th className="text-left px-4 py-3 text-[#606070] font-medium uppercase tracking-wider text-xs">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row, i) => (
                          <tr
                            key={row.key}
                            className={`border-b border-bg-tertiary last:border-0 ${i % 2 === 0 ? 'bg-[#0D0D15]' : 'bg-bg-primary'}`}
                          >
                            <td className="px-4 py-3 font-mono text-accent-primary">{row.key}</td>
                            <td className="px-4 py-3">
                              {row.required ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[#00D4AA]/10 text-accent-primary border border-[#00D4AA]/20">
                                  required
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-bg-tertiary text-[#606070] border border-[#2A2A34]">
                                  optional
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-text-secondary">{row.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {section.type === 'code' && (
                  <div className="relative rounded-xl overflow-hidden border border-bg-tertiary bg-[#0D0D15]">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-bg-tertiary bg-[#111118]">
                      <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                      <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                      <span className="w-3 h-3 rounded-full bg-[#28C840]" />
                      <span className="ml-2 text-xs text-[#606070]">json</span>
                    </div>
                    <pre className="px-5 py-4 overflow-x-auto text-sm leading-relaxed">
                      <code className="text-accent-primary font-mono">{section.code}</code>
                    </pre>
                  </div>
                )}

                {section.type === 'list' && (
                  <ul className="space-y-3">
                    {section.content.map((item, i) => {
                      const parts = item.split('**')
                      return (
                        <li key={i} className="flex items-start gap-3 text-[#C0C0D0]">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#00D4AA] flex-shrink-0" />
                          <span>
                            {parts.map((part, j) =>
                              j % 2 === 1 ? (
                                <strong key={j} className="text-white font-semibold">
                                  {part}
                                </strong>
                              ) : (
                                part
                              )
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Next / Prev navigation */}
          <div className="mt-14 pt-8 border-t border-bg-tertiary grid grid-cols-2 gap-4">
            <Link
              href="/docs/install"
              className="group flex flex-col p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">← Previous</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                ⚙️ Installation
              </span>
            </Link>
            <Link
              href="/docs/requirements"
              className="group flex flex-col items-end p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">Next →</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                📋 Requirements
              </span>
            </Link>
          </div>

        </main>
      </div>
      <Footer config={config} />
    </div>
  )
}
