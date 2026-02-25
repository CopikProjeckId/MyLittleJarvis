import { getConfig } from '@/lib/server-config'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export const metadata: Metadata = {
  title: 'Memory System - MyLittleJarvis Docs',
  description: 'Learn how MyLittleJarvis remembers context, preferences, and past interactions using its persistent memory system.',
}

const memorySections = [
  {
    id: 'overview',
    title: 'Overview',
    icon: '🧠',
    content: [
      'JARVIS maintains a persistent memory layer that survives restarts and session boundaries.',
      'Memory is stored in structured markdown files organized by topic and importance.',
      'The agent automatically decides what to remember, update, or forget based on relevance.',
      'You can also explicitly instruct JARVIS to remember or forget specific information.',
    ],
    type: 'list' as const,
  },
  {
    id: 'memory-types',
    title: 'Memory Types',
    icon: '📂',
    content: [
      {
        name: 'Core Memory (MEMORY.md)',
        desc: 'Always loaded into context. Holds your preferences, identity, and frequently used facts. Kept concise (under 200 lines).',
        badge: 'Always Active',
        badgeColor: '#00D4AA',
      },
      {
        name: 'Topic Files',
        desc: 'Detailed notes organized by subject — e.g., debugging.md, patterns.md. Linked from MEMORY.md and loaded on demand.',
        badge: 'On Demand',
        badgeColor: '#00B4D8',
      },
      {
        name: 'Session Context',
        desc: 'Temporary in-conversation state. Not persisted. Cleared at the end of each session.',
        badge: 'Ephemeral',
        badgeColor: '#606070',
      },
    ],
    type: 'cards' as const,
  },
  {
    id: 'commands',
    title: 'Memory Commands',
    icon: '⌨️',
    content: [
      {
        label: 'Remember a fact',
        code: 'Remember: I always use bun instead of npm',
      },
      {
        label: 'Forget something',
        code: 'Forget that I prefer dark mode — I switched to light',
      },
      {
        label: 'View current memory',
        code: 'Show me what you remember about me',
      },
      {
        label: 'Clear topic memory',
        code: 'Clear your notes about the old project structure',
      },
    ],
    type: 'code' as const,
  },
  {
    id: 'auto-memory',
    title: 'Auto Memory',
    icon: '⚡',
    content: [
      'JARVIS learns from every interaction and saves patterns it detects as recurring.',
      'Architectural decisions and key file paths are saved automatically after confirmed use.',
      'Mistakes and their solutions are captured to prevent repeated errors.',
      'Auto memory only saves after verification — speculative or one-off context is never persisted.',
    ],
    type: 'list' as const,
  },
  {
    id: 'storage',
    title: 'Storage Location',
    icon: '💾',
    content: [
      {
        label: 'Memory directory',
        code: '~/.claude/projects/<project-hash>/memory/',
      },
      {
        label: 'Core memory file',
        code: '~/.claude/projects/<project-hash>/memory/MEMORY.md',
      },
      {
        label: 'Topic files (example)',
        code: '~/.claude/projects/<project-hash>/memory/debugging.md\n~/.claude/projects/<project-hash>/memory/patterns.md',
      },
    ],
    type: 'code' as const,
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    icon: '✅',
    content: [
      'Keep MEMORY.md under 200 lines — content beyond that is truncated from the system prompt.',
      'Use topic files for detailed notes and link to them from MEMORY.md.',
      'Remove outdated or contradictory memories when your setup changes.',
      'Organize memory by topic rather than chronologically for easier retrieval.',
      'Explicitly ask JARVIS to remember critical preferences to ensure they are saved immediately.',
    ],
    type: 'list' as const,
  },
]

type CardItem = { name: string; desc: string; badge: string; badgeColor: string }
type CodeItem = { label: string; code: string }

export default async function MemoryPage() {
  const config = await getConfig()
  const page = config.docs.pages.memory as {
    title?: string
    icon?: string
    content?: string
  } | undefined
  const sidebar = config.docs.sidebar

  const pageTitle = page?.title ?? 'Memory System'
  const pageIcon = page?.icon ?? '🧠'

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
                  const isActive = item.slug === 'memory'
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
            <span className="text-text-secondary">Core Concepts</span>
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
              JARVIS remembers who you are, how you work, and what matters — across every session.
            </p>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#00D4AA]/10 text-accent-primary border border-[#00D4AA]/20 rounded-full px-3 py-1">
                🧠 Persistent
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-secondary border border-[#2A2A34] rounded-full px-3 py-1">
                📁 File-based
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-secondary border border-[#2A2A34] rounded-full px-3 py-1">
                ⚡ Auto + Manual
              </span>
            </div>
          </div>

          {/* Content sections */}
          <div className="space-y-10">
            {memorySections.map((section) => (
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

                {section.type === 'cards' && (
                  <div className="space-y-3">
                    {(section.content as CardItem[]).map((card, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 p-4 rounded-xl border border-bg-tertiary bg-[#0D0D15]"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{card.name}</span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full border"
                              style={{
                                color: card.badgeColor,
                                borderColor: `${card.badgeColor}33`,
                                backgroundColor: `${card.badgeColor}11`,
                              }}
                            >
                              {card.badge}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary leading-relaxed">{card.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {section.type === 'code' && (
                  <div className="space-y-4">
                    {(section.content as CodeItem[]).map((item, i) => (
                      <div key={i}>
                        <p className="text-sm text-text-secondary mb-2 font-medium">{item.label}</p>
                        <div className="relative rounded-xl overflow-hidden border border-bg-tertiary bg-[#0D0D15]">
                          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-bg-tertiary bg-[#111118]">
                            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
                            <span className="ml-2 text-xs text-[#606070]">terminal</span>
                          </div>
                          <pre className="px-5 py-4 overflow-x-auto text-sm leading-relaxed">
                            <code className="text-accent-primary font-mono">{item.code}</code>
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Next / Prev navigation */}
          <div className="mt-14 pt-8 border-t border-bg-tertiary grid grid-cols-2 gap-4">
            <Link
              href="/docs/architecture"
              className="group flex flex-col p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">← Previous</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                🏗️ Architecture
              </span>
            </Link>
            <Link
              href="/docs/personas"
              className="group flex flex-col items-end p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">Next →</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                🎭 Personas
              </span>
            </Link>
          </div>

        </main>
      </div>
      <Footer config={config} />
    </div>
  )
}
