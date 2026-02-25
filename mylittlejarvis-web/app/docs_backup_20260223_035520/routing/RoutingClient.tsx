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
              const isActive = item.slug === 'routing'
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

// ─── Code Block ───────────────────────────────────────────────────────────────

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="rounded-xl bg-[#111118] border border-bg-tertiary overflow-hidden">
      {label && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-bg-tertiary bg-white/5">
          <span className="text-xs font-mono text-text-secondary">{label}</span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm text-[#C0C0D0] font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ─── Route Card ──────────────────────────────────────────────────────────────

function RouteCard({
  method,
  path,
  desc,
  badge,
  badgeColor = '#00D4AA',
}: {
  method: string
  path: string
  desc: string
  badge?: string
  badgeColor?: string
}) {
  const methodColors: Record<string, string> = {
    GET: '#00D4AA',
    POST: '#00B4D8',
    PUT: '#A78BFA',
    DELETE: '#F87171',
    WS: '#F59E0B',
  }
  const color = methodColors[method] ?? '#A0A0B0'
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-4 hover:border-[#00D4AA]/30 transition-colors">
      <span
        className="inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-bold font-mono min-w-[48px] text-center"
        style={{ background: `${color}20`, color }}
      >
        {method}
      </span>
      <code className="text-sm text-white font-mono flex-1">{path}</code>
      {badge && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${badgeColor}20`, color: badgeColor }}
        >
          {badge}
        </span>
      )}
      <p className="text-sm text-text-secondary sm:ml-2 sm:text-right">{desc}</p>
    </div>
  )
}

// ─── Client Component ────────────────────────────────────────────────────────

export function RoutingClient({ config }: { config: SiteConfig }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { docs } = config
  const page = (docs.pages as Record<string, { title?: string; icon?: string; content?: string }>).routing ?? {}

  return (
    <div className="docs-container">
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
            <span className="text-white">Routing</span>
          </div>

          {/* Page header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-[#00D4AA] text-xs font-medium mb-6">
              {page.icon ?? '🔀'} Request Routing
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-4 leading-tight">
              {page.title ?? 'Routing'}
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl leading-relaxed">
              {page.content ?? 'How MyLittleJarvis routes incoming requests across voice, text, and API channels to the right handlers.'}
            </p>
          </div>

          {/* ── Overview ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Overview
            </h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Jarvis uses a layered routing model. Incoming traffic — whether from the REST API, a WebSocket
              stream, or the local voice pipeline — is normalised into a unified <code className="text-[#00D4AA] bg-[#00D4AA]/10 px-1.5 py-0.5 rounded text-xs">Request</code> envelope before
              any business logic runs. Route resolution happens in three stages: channel detection,
              authentication, and handler dispatch.
            </p>

            <div className="rounded-2xl bg-[#111118] border border-bg-tertiary p-6">
              <div className="flex flex-col gap-3">
                {/* Stage row */}
                {[
                  { step: '1', label: 'Channel Detection', desc: 'Identify source: HTTP, WS, or Voice', color: '#A78BFA' },
                  { step: '2', label: 'Auth & Rate Limit', desc: 'Validate API key / session token', color: '#00D4AA' },
                  { step: '3', label: 'Handler Dispatch', desc: 'Match route → execute handler', color: '#00B4D8' },
                  { step: '4', label: 'Response Serialisation', desc: 'Format for the originating channel', color: '#F59E0B' },
                ].map((s, i, arr) => (
                  <div key={s.step} className="flex flex-col items-center gap-1">
                    <div
                      className="w-full flex items-center gap-4 rounded-xl px-5 py-3"
                      style={{ background: `${s.color}10`, border: `1px solid ${s.color}30` }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `${s.color}30`, color: s.color }}
                      >
                        {s.step}
                      </span>
                      <span className="font-semibold text-white text-sm">{s.label}</span>
                      <span className="text-text-secondary text-xs ml-auto">{s.desc}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <span className="text-text-secondary text-base leading-none">↓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── REST Routes ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              REST API Routes
            </h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              All REST endpoints are prefixed with <code className="text-[#00D4AA] bg-[#00D4AA]/10 px-1.5 py-0.5 rounded text-xs">/api/v1</code>.
              Requests must include an <code className="text-[#00D4AA] bg-[#00D4AA]/10 px-1.5 py-0.5 rounded text-xs">Authorization: Bearer &lt;token&gt;</code> header
              unless marked as public.
            </p>

            <div className="space-y-3">
              <RouteCard method="GET"    path="/api/v1/health"            desc="Service health check"           badge="Public" badgeColor="#00D4AA" />
              <RouteCard method="POST"   path="/api/v1/chat"              desc="Send a message, receive reply"  badge="Auth" badgeColor="#00B4D8" />
              <RouteCard method="GET"    path="/api/v1/conversations"     desc="List conversation history"      badge="Auth" badgeColor="#00B4D8" />
              <RouteCard method="GET"    path="/api/v1/conversations/:id" desc="Fetch a single conversation"    badge="Auth" badgeColor="#00B4D8" />
              <RouteCard method="DELETE" path="/api/v1/conversations/:id" desc="Delete a conversation"          badge="Auth" badgeColor="#00B4D8" />
              <RouteCard method="GET"    path="/api/v1/tools"             desc="List registered tool handlers"  badge="Auth" badgeColor="#00B4D8" />
              <RouteCard method="POST"   path="/api/v1/tools/:name/run"   desc="Invoke a tool directly"         badge="Auth" badgeColor="#00B4D8" />
            </div>
          </section>

          {/* ── WebSocket ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              WebSocket Streaming
            </h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              For real-time streaming responses connect to the WebSocket endpoint. Authentication is passed as
              a query parameter on the initial handshake.
            </p>

            <div className="space-y-4">
              <RouteCard method="WS" path="ws://localhost:3000/api/v1/stream" desc="Streaming chat channel" badge="Auth" badgeColor="#F59E0B" />

              <CodeBlock label="client example — stream.js" code={`const ws = new WebSocket(
  'ws://localhost:3000/api/v1/stream?token=YOUR_API_KEY'
)

ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'message', text: 'Hello, Jarvis!' }))
}

ws.onmessage = ({ data }) => {
  const { type, delta, done } = JSON.parse(data)
  if (type === 'delta') process.stdout.write(delta)
  if (done) ws.close()
}`} />
            </div>
          </section>

          {/* ── Voice Pipeline ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Voice Pipeline Routing
            </h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Voice input bypasses the HTTP layer entirely. The local voice daemon captures audio, transcribes
              it, and injects a synthetic <code className="text-[#00D4AA] bg-[#00D4AA]/10 px-1.5 py-0.5 rounded text-xs">Request</code> directly into the core routing loop.
            </p>

            <div className="space-y-4">
              {[
                { icon: '🎙️', title: 'Wake-word detected', desc: 'Porcupine / Whisper wakes the daemon and begins buffering audio.' },
                { icon: '📝', title: 'STT transcription', desc: 'Audio buffer is transcribed to text (on-device or Deepgram).' },
                { icon: '🔀', title: 'Synthetic request injected', desc: 'Transcribed text is wrapped in a Request envelope with source: "voice".' },
                { icon: '💬', title: 'Reply synthesised', desc: 'The final text reply is passed to the TTS engine and played back.' },
              ].map((step) => (
                <div key={step.title} className="flex items-start gap-4 rounded-xl bg-white/5 border border-white/10 p-4 hover:border-[#00D4AA]/30 transition-colors">
                  <span className="text-2xl flex-shrink-0">{step.icon}</span>
                  <div>
                    <p className="font-semibold text-white text-sm mb-1">{step.title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Custom Routes ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Adding Custom Routes
            </h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Register additional REST endpoints inside <code className="text-[#00D4AA] bg-[#00D4AA]/10 px-1.5 py-0.5 rounded text-xs">src/routes/</code>.
              Each file exports a router that is auto-discovered and mounted at startup.
            </p>

            <CodeBlock label="src/routes/weather.ts" code={`import { Router } from 'jarvis-sdk'

const router = new Router({ prefix: '/weather' })

router.get('/', async (req, res) => {
  const { location } = req.query
  const data = await fetchWeather(location as string)
  res.json({ location, ...data })
})

export default router`} />

            <p className="text-text-secondary text-sm mt-4 leading-relaxed">
              The router is automatically mounted at <code className="text-[#00D4AA] bg-[#00D4AA]/10 px-1.5 py-0.5 rounded text-xs">/api/v1/weather</code>.
              No additional registration required — just drop the file in the routes directory.
            </p>
          </section>

          {/* ── Next steps ── */}
          <section className="rounded-2xl bg-gradient-to-br from-[#00D4AA]/10 to-[#00B4D8]/10 border border-[#00D4AA]/20 p-8">
            <h3 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Explore further
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              Learn about authentication, available tools, and the plugin SDK.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/docs/api" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4AA] text-[#0A0A0F] font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors text-sm">
                🔌 API Reference
              </Link>
              <Link href="/docs/architecture" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm">
                🏗️ Architecture
              </Link>
              <Link href="/docs/plugins" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm">
                🔌 Plugin SDK
              </Link>
            </div>
          </section>

        </main>
      </div>

      <Footer config={config} />
    </div>
  )
}
