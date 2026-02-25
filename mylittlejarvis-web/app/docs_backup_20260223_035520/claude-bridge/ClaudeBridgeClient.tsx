'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SiteConfig, DocsSidebarSection } from '@/lib/server-config'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

// ─── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({
  sections,
  onNavigate,
}: {
  sections: DocsSidebarSection[]
  onNavigate?: () => void
}) {
  return (
    <nav className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-2 px-2">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const href = item.slug ? `/docs/${item.slug}` : '/docs'
              const isActive = item.slug === 'claude-bridge'
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-[#00D4AA]/10 text-[#00D4AA] font-medium'
                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

// ─── Code Block ──────────────────────────────────────────────────────────────

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-xl bg-[#0D0D14] border border-bg-tertiary overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-bg-tertiary">
        <span className="text-xs text-text-secondary font-mono">{lang}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-text-secondary hover:text-[#00D4AA] transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-[#C0C0D0] font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  desc,
  badge,
  badgeColor = '#00D4AA',
}: {
  icon: string
  title: string
  desc: string
  badge?: string
  badgeColor?: string
}) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-6 hover:border-[#00D4AA]/30 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold font-[family-name:var(--font-space-grotesk)] text-white">
              {title}
            </h3>
            {badge && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${badgeColor}20`, color: badgeColor }}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Client Component ────────────────────────────────────────────────────────

export default function ClaudeBridgeClient({ config }: { config: SiteConfig }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { docs } = config
  const page = (docs.pages as Record<string, { title: string; icon?: string; content?: string }>)['claude-bridge']

  return (
    <div className="docs-container">
      {/* ── Header ── */}
      <Header config={config} />

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Layout ── */}
      <div className="docs-layout">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 fixed h-[calc(100vh-72px)] overflow-y-auto border-r border-bg-tertiary py-8 px-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4AA] mb-6 px-2">
            {docs.sidebar.title}
          </p>
          <Sidebar sections={docs.sidebar.sections} />
        </aside>

        {/* Mobile sidebar */}
        <aside
          className={`fixed lg:hidden w-72 h-[calc(100vh-72px)] top-[72px] overflow-y-auto border-r border-bg-tertiary bg-bg-primary py-8 px-4 z-50 transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4AA] mb-6 px-2">
            {docs.sidebar.title}
          </p>
          <Sidebar sections={docs.sidebar.sections} onNavigate={() => setMobileOpen(false)} />
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-8 py-12 max-w-4xl w-full">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-8">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <span>/</span>
            <span className="text-white">Claude Bridge</span>
          </div>

          {/* Page header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-[#00D4AA] text-xs font-medium mb-6">
              {page?.icon ?? '🌉'} Claude Integration
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-4 leading-tight">
              {page?.title ?? 'Claude Bridge'}
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl leading-relaxed">
              {page?.content ?? 'The Claude Bridge is the secure communication layer between MyLittleJarvis agents and Anthropic\'s Claude API — handling authentication, streaming, token budgets, and fallback routing.'}
            </p>
          </div>

          {/* ── Overview ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              What is the Claude Bridge?
            </h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              The Claude Bridge acts as a smart proxy between your JARVIS agent runtime and the Claude API.
              It manages API key rotation, per-session context windows, streaming SSE responses, cost tracking,
              and automatic model fallback — so your agent stays responsive even under load.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Avg latency', value: '~320ms', sub: 'first token', color: '#00D4AA' },
                { label: 'Cost savings', value: 'up to 60%', sub: 'vs naive calls', color: '#A78BFA' },
                { label: 'Uptime SLA', value: '99.9%', sub: 'with fallback', color: '#00B4D8' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-[#111118] border border-bg-tertiary p-5 text-center"
                >
                  <p className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)]" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">{stat.sub}</p>
                  <p className="text-xs text-[#606070] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Features ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Core Capabilities
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Every feature is designed to keep your agent fast, cheap, and reliable.
            </p>

            <div className="space-y-4">
              <FeatureCard
                icon="🔑"
                title="API Key Rotation"
                badge="Security"
                badgeColor="#A78BFA"
                desc="Automatically cycles between multiple Anthropic API keys to distribute rate-limit headroom. Keys are stored encrypted and never exposed to the agent runtime."
              />
              <FeatureCard
                icon="📡"
                title="Streaming SSE"
                badge="Performance"
                badgeColor="#00D4AA"
                desc="Forwards server-sent events from Claude directly to your client with sub-100ms relay latency. Supports both token-by-token and chunk-buffered modes."
              />
              <FeatureCard
                icon="💰"
                title="Token Budget Enforcement"
                badge="Cost Control"
                badgeColor="#F59E0B"
                desc="Per-session and per-user token limits prevent runaway costs. When a budget is exceeded the bridge returns a structured error instead of silently overspending."
              />
              <FeatureCard
                icon="🔀"
                title="Model Fallback Routing"
                badge="Reliability"
                badgeColor="#00B4D8"
                desc="Configures a priority list of Claude models (e.g. claude-opus-4-6 → claude-sonnet-4-6 → claude-haiku-4-5). On rate-limit or error, the bridge retries with the next available model automatically."
              />
              <FeatureCard
                icon="🧠"
                title="Context Window Management"
                badge="Smart"
                badgeColor="#00D4AA"
                desc="Tracks token counts per session and auto-truncates or summarises older turns before they exceed the model's context limit, preserving the most relevant history."
              />
            </div>
          </section>

          {/* ── Configuration ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Configuration
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Configure the bridge in <code className="text-[#00D4AA] bg-[#00D4AA]/10 px-1 rounded">config/claude-bridge.yaml</code> or via environment variables.
            </p>

            <div className="space-y-6">
              <CodeBlock
                lang="yaml"
                code={`# config/claude-bridge.yaml
claude_bridge:
  # API key pool — keys are rotated round-robin
  api_keys:
    - \${ANTHROPIC_API_KEY_1}
    - \${ANTHROPIC_API_KEY_2}   # optional second key

  # Model fallback priority list
  models:
    - claude-opus-4-6
    - claude-sonnet-4-6
    - claude-haiku-4-5-20251001

  # Streaming
  streaming:
    enabled: true
    mode: token          # token | chunk
    chunk_size_bytes: 512

  # Token budgets
  budgets:
    per_session: 100000  # tokens
    per_user_day: 500000

  # Context management
  context:
    strategy: summarise  # truncate | summarise
    summary_model: claude-haiku-4-5-20251001
    reserve_tokens: 2048`}
              />

              <CodeBlock
                lang="bash"
                code={`# Equivalent environment variables
CLAUDE_BRIDGE_API_KEYS=key1,key2
CLAUDE_BRIDGE_MODELS=claude-opus-4-6,claude-sonnet-4-6,claude-haiku-4-5-20251001
CLAUDE_BRIDGE_STREAMING=true
CLAUDE_BRIDGE_BUDGET_SESSION=100000
CLAUDE_BRIDGE_BUDGET_USER_DAY=500000`}
              />
            </div>
          </section>

          {/* ── Usage ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Usage
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Import the bridge client in your agent code. It exposes the same interface as the official Anthropic SDK.
            </p>

            <div className="space-y-6">
              <div>
                <p className="text-xs text-text-secondary mb-2">Basic completion</p>
                <CodeBlock
                  lang="typescript"
                  code={`import { ClaudeBridge } from '@mylittlejarvis/claude-bridge'

const bridge = new ClaudeBridge() // reads config automatically

const response = await bridge.messages.create({
  model: 'claude-opus-4-6',      // falls back automatically if unavailable
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'What is the capital of France?' }
  ]
})

console.log(response.content[0].text)`}
                />
              </div>

              <div>
                <p className="text-xs text-text-secondary mb-2">Streaming</p>
                <CodeBlock
                  lang="typescript"
                  code={`const stream = await bridge.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 2048,
  messages: [{ role: 'user', content: 'Explain quantum entanglement.' }]
})

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    process.stdout.write(chunk.delta.text)
  }
}

const usage = await stream.finalMessage()
console.log('Tokens used:', usage.usage.input_tokens + usage.usage.output_tokens)`}
                />
              </div>

              <div>
                <p className="text-xs text-text-secondary mb-2">Session-aware context tracking</p>
                <CodeBlock
                  lang="typescript"
                  code={`// Pass a sessionId to enable automatic context window management
const session = bridge.session('user-42-session-001')

// Each call automatically appends to the session history
const r1 = await session.send('My name is Alice.')
const r2 = await session.send('What is my name?')  // → "Your name is Alice."

// Inspect token usage
console.log(session.tokensUsed)   // running total
console.log(session.budgetLeft)   // based on config limits`}
                />
              </div>
            </div>
          </section>

          {/* ── How it works ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              How It Works
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Each API call passes through five internal stages before reaching Claude.
            </p>

            <ol className="relative border-l border-bg-tertiary ml-3 space-y-8">
              {[
                {
                  step: '01',
                  title: 'Key Selection',
                  color: '#A78BFA',
                  desc: 'The bridge picks the API key with the most remaining rate-limit headroom using a weighted round-robin algorithm. If all keys are exhausted it queues the request and retries after the reset window.',
                },
                {
                  step: '02',
                  title: 'Budget Check',
                  color: '#F59E0B',
                  desc: 'Session and user-day token counters are checked against configured limits. Requests that would exceed the budget are rejected with a structured BudgetExceeded error before any API call is made.',
                },
                {
                  step: '03',
                  title: 'Context Preparation',
                  color: '#00D4AA',
                  desc: 'The session history is loaded, token-counted, and trimmed if necessary. When summarisation is enabled, older turns are condensed by a fast haiku call and replaced with a summary block.',
                },
                {
                  step: '04',
                  title: 'Claude API Call',
                  color: '#00D4AA',
                  desc: 'The prepared request is forwarded to the Claude API using the highest-priority available model. If a 529 or 529-equivalent rate-limit error is returned, the next model in the fallback list is tried.',
                },
                {
                  step: '05',
                  title: 'Response Relay & Accounting',
                  color: '#00B4D8',
                  desc: 'Streaming tokens are forwarded in real-time. On completion, actual token usage is recorded against session and user-day counters, and the turn is appended to the session history store.',
                },
              ].map((flow) => (
                <li key={flow.step} className="ml-8">
                  <span
                    className="absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                    style={{ background: `${flow.color}20`, color: flow.color, border: `1px solid ${flow.color}40` }}
                  >
                    {flow.step}
                  </span>
                  <h3 className="font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-1">
                    {flow.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{flow.desc}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Troubleshooting ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Troubleshooting
            </h2>
            <p className="text-text-secondary text-sm mb-6">Common errors and how to resolve them.</p>

            <div className="space-y-3">
              {[
                {
                  code: 'BudgetExceeded',
                  cause: 'Session or daily token limit reached.',
                  fix: 'Increase budgets.per_session or budgets.per_user_day in config, or call session.reset() to clear history.',
                },
                {
                  code: 'AllModelsUnavailable',
                  cause: 'Every model in the fallback list returned a rate-limit error.',
                  fix: 'Add additional API keys to the key pool, or reduce request concurrency in your agent.',
                },
                {
                  code: 'ContextTruncated',
                  cause: 'Session history was truncated to fit within the model context window.',
                  fix: 'Switch context.strategy to summarise for lossless condensing, or increase reserve_tokens to retain more history.',
                },
                {
                  code: 'InvalidApiKey',
                  cause: 'One or more configured keys are invalid or revoked.',
                  fix: 'Verify keys in your Anthropic console and update ANTHROPIC_API_KEY_* env vars.',
                },
              ].map((err) => (
                <div
                  key={err.code}
                  className="rounded-xl bg-[#111118] border border-bg-tertiary p-5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-sm font-mono text-[#F87171] bg-[#F87171]/10 px-2 py-0.5 rounded">
                      {err.code}
                    </code>
                  </div>
                  <p className="text-xs text-text-secondary mb-1"><span className="text-[#606070]">Cause: </span>{err.cause}</p>
                  <p className="text-xs text-text-secondary"><span className="text-[#00D4AA]">Fix: </span>{err.fix}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Next steps ── */}
          <section className="rounded-2xl bg-gradient-to-br from-[#00D4AA]/10 to-[#00B4D8]/10 border border-[#00D4AA]/20 p-8">
            <h3 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Continue exploring
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              Learn how the bridge fits into the broader architecture or dive into the full API reference.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs/architecture"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4AA] text-[#0A0A0F] font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors text-sm"
              >
                🏗️ Architecture Overview
              </Link>
              <Link
                href="/docs/api"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                🔌 API Reference
              </Link>
              <Link
                href="/docs/configuration"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                ⚙️ Configuration
              </Link>
            </div>
          </section>

        </main>
      </div>

      {/* ── Footer ── */}
      <Footer config={config} />
    </div>
  )
}
