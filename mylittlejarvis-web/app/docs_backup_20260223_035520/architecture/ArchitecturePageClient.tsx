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
              const isActive = item.slug === 'architecture'
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

// ─── Diagram Box ─────────────────────────────────────────────────────────────

function DiagramBox({
  label,
  sublabel,
  color = '#00D4AA',
  icon,
}: {
  label: string
  sublabel?: string
  color?: string
  icon?: string
}) {
  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-3 rounded-xl border text-center min-w-[120px]"
      style={{ borderColor: `${color}40`, background: `${color}10` }}
    >
      {icon && <span className="text-xl mb-1">{icon}</span>}
      <span className="text-sm font-semibold text-white">{label}</span>
      {sublabel && <span className="text-xs text-text-secondary mt-0.5">{sublabel}</span>}
    </div>
  )
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 mx-1">
      {label && <span className="text-[10px] text-text-secondary">{label}</span>}
      <span className="text-[#00D4AA] text-lg leading-none">→</span>
    </div>
  )
}

// ─── Client Component ────────────────────────────────────────────────────────

export default function ArchitecturePageClient({ config }: { config: SiteConfig }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { docs } = config
  const page = docs.pages.architecture as { title: string; icon?: string; content?: string }

  return (
    <div className="docs-container">
      <Header config={config} />

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Layout ── */}
      <div className="docs-layout">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 fixed h-[calc(100vh-4rem)] overflow-y-auto border-r border-bg-tertiary py-8 px-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4AA] mb-6 px-2">
            {docs.sidebar.title}
          </p>
          <Sidebar sections={docs.sidebar.sections} />
        </aside>

        {/* Mobile sidebar */}
        <aside
          className={`fixed lg:hidden w-72 h-[calc(100vh-4rem)] top-16 overflow-y-auto border-r border-bg-tertiary bg-bg-primary py-8 px-4 z-50 transition-transform duration-300 ${
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
            <span className="text-white">Architecture</span>
          </div>

          {/* Page header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-[#00D4AA] text-xs font-medium mb-6">
              {page.icon ?? '🏗️'} System Design
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-4 leading-tight">
              {page.title}
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl leading-relaxed">
              {page.content ?? 'Overview of MyLittleJarvis system architecture and components.'}
            </p>
          </div>

          {/* ── System Diagram ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              System Diagram
            </h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              MyLittleJarvis follows a layered architecture: user input enters through voice or text interfaces, is
              processed by the AI core, routed through a tool-dispatch layer, and finally executed against
              external services or local APIs.
            </p>

            {/* Diagram */}
            <div className="rounded-2xl bg-[#111118] border border-bg-tertiary p-6 overflow-x-auto">
              {/* Row 1: Input layer */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <DiagramBox label="Voice Input" sublabel="STT / Wake Word" icon="🎙️" color="#A78BFA" />
                <Arrow />
                <DiagramBox label="Text Input" sublabel="CLI / API / Web" icon="⌨️" color="#A78BFA" />
              </div>

              {/* Down arrow */}
              <div className="flex justify-center mb-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-text-secondary">unified request</span>
                  <span className="text-text-secondary text-lg">↓</span>
                </div>
              </div>

              {/* Row 2: Core */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <DiagramBox label="Intent Parser" sublabel="NLU + Context" icon="🧠" color="#00D4AA" />
                <Arrow label="prompt" />
                <DiagramBox label="LLM Engine" sublabel="Claude / GPT" icon="✨" color="#00D4AA" />
                <Arrow label="response" />
                <DiagramBox label="Response Builder" sublabel="TTS / Text" icon="💬" color="#00D4AA" />
              </div>

              {/* Down arrow */}
              <div className="flex justify-center mb-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-text-secondary">tool calls</span>
                  <span className="text-text-secondary text-lg">↓</span>
                </div>
              </div>

              {/* Row 3: Tool layer */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <DiagramBox label="Tool Router" sublabel="Dispatch" icon="🔀" color="#00B4D8" />
              </div>

              <div className="flex items-center justify-center gap-2">
                <DiagramBox label="Calendar" sublabel="Google / iCal" icon="📅" color="#F59E0B" />
                <DiagramBox label="Smart Home" sublabel="Home Assistant" icon="🏠" color="#F59E0B" />
                <DiagramBox label="Search" sublabel="Web / Local" icon="🔍" color="#F59E0B" />
                <DiagramBox label="Custom APIs" sublabel="User Plugins" icon="🔌" color="#F59E0B" />
              </div>
            </div>

            <p className="text-xs text-text-secondary mt-3 px-1">
              Color coding — <span className="text-[#A78BFA]">purple</span>: input layer &nbsp;·&nbsp;
              <span className="text-[#00D4AA]">teal</span>: AI core &nbsp;·&nbsp;
              <span className="text-[#00B4D8]">blue</span>: routing &nbsp;·&nbsp;
              <span className="text-[#F59E0B]">amber</span>: external integrations
            </p>
          </section>

          {/* ── Component Breakdown ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Component Breakdown
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Each layer is independently deployable and replaceable. Swap the LLM backend without touching
              the tool layer, or add a new integration without modifying core logic.
            </p>

            <div className="space-y-4">
              {[
                {
                  icon: '🎙️',
                  name: 'Input Layer',
                  badge: 'Edge',
                  badgeColor: '#A78BFA',
                  desc: 'Handles voice (wake-word detection, STT) and text (REST API, WebSocket, CLI). Normalises all input into a unified request envelope before forwarding to the core.',
                  items: ['Wake-word detector (Porcupine / Whisper)', 'Speech-to-text (Whisper / Deepgram)', 'HTTP/WS gateway', 'CLI adapter'],
                },
                {
                  icon: '🧠',
                  name: 'AI Core',
                  badge: 'Core',
                  badgeColor: '#00D4AA',
                  desc: 'The brain. Maintains conversation context, builds prompts with memory injection, calls the configured LLM, and parses structured tool-call responses.',
                  items: ['Intent parser & slot filler', 'Conversation memory (vector DB)', 'LLM client (Claude / OpenAI)', 'Tool-call response parser'],
                },
                {
                  icon: '🔀',
                  name: 'Tool Router',
                  badge: 'Middleware',
                  badgeColor: '#00B4D8',
                  desc: 'Receives structured tool-call payloads from the AI core, resolves the correct handler, enforces permissions, and streams results back.',
                  items: ['Handler registry', 'Permission & rate-limit guard', 'Result serialiser', 'Error boundary & retry logic'],
                },
                {
                  icon: '🔌',
                  name: 'Integration Layer',
                  badge: 'External',
                  badgeColor: '#F59E0B',
                  desc: 'Concrete adapters for external services. Each adapter exposes a standard interface so the tool router stays service-agnostic.',
                  items: ['Google Calendar / iCal', 'Home Assistant (MQTT / REST)', 'Web search (Brave / Serper)', 'User-defined plugin SDK'],
                },
              ].map((comp) => (
                <div
                  key={comp.name}
                  className="rounded-xl bg-white/5 border border-white/10 p-6 hover:border-[#00D4AA]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{comp.icon}</span>
                    <h3 className="font-bold font-[family-name:var(--font-space-grotesk)] text-white text-lg">
                      {comp.name}
                    </h3>
                    <span
                      className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${comp.badgeColor}20`, color: comp.badgeColor }}
                    >
                      {comp.badge}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-4 leading-relaxed">{comp.desc}</p>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {comp.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-[#C0C0D0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── Data Flow ── */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Data Flow
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              A single user request travels through five distinct stages, each with clear contracts between layers.
            </p>

            <ol className="relative border-l border-bg-tertiary ml-3 space-y-8">
              {[
                {
                  step: '01',
                  title: 'Capture',
                  color: '#A78BFA',
                  desc: 'Voice or text input is captured at the edge. Audio is transcribed to text; all inputs are wrapped in a unified Request object containing raw text, source type, session ID, and timestamp.',
                },
                {
                  step: '02',
                  title: 'Parse & Enrich',
                  color: '#00D4AA',
                  desc: 'The Intent Parser extracts intent, entities, and slots. Recent conversation turns and relevant long-term memories are fetched from the vector store and injected into the prompt context.',
                },
                {
                  step: '03',
                  title: 'LLM Inference',
                  color: '#00D4AA',
                  desc: 'The enriched prompt is sent to the configured LLM. The model returns either a plain-text reply or a structured tool-call payload (JSON) requesting one or more actions.',
                },
                {
                  step: '04',
                  title: 'Tool Dispatch',
                  color: '#00B4D8',
                  desc: 'If tool calls are present, the Tool Router resolves each handler, checks permissions, executes concurrently where possible, and collects results. Results are fed back into the LLM for a final summarised reply.',
                },
                {
                  step: '05',
                  title: 'Respond',
                  color: '#F59E0B',
                  desc: 'The final reply is formatted for the output channel — synthesised to speech for voice mode, or returned as JSON/Markdown for API and web clients. The exchange is persisted to memory.',
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

          {/* ── Next steps ── */}
          <section className="rounded-2xl bg-gradient-to-br from-[#00D4AA]/10 to-[#00B4D8]/10 border border-[#00D4AA]/20 p-8">
            <h3 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Explore further
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              Dive into specific subsystems or jump straight to the API reference.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/docs/api" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4AA] text-[#0A0A0F] font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors text-sm">
                🔌 API Reference
              </Link>
              <Link href="/docs/configuration" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm">
                ⚙️ Configuration
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
