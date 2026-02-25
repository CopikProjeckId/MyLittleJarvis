import { getConfig } from '@/lib/server-config'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export const metadata: Metadata = {
  title: 'Quick Start - MyLittleJarvis Docs',
  description: 'Get up and running with MyLittleJarvis in under 3 minutes.',
}

const codeSteps = [
  {
    label: '1. Clone the repository',
    code: `git clone https://github.com/mylittlejarvis/jarvis-agent.git
cd jarvis-agent`,
  },
  {
    label: '2. Install dependencies',
    code: `npm install`,
  },
  {
    label: '3. Configure environment',
    code: `cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY`,
  },
  {
    label: '4. Run the setup script',
    code: `./setup.sh`,
  },
  {
    label: '5. Connect your phone',
    code: `# Scan the QR code shown in the terminal
# Open MyLittleJarvis app on your phone`,
  },
]

const sections = [
  {
    id: 'prerequisites',
    title: 'Prerequisites',
    icon: '📋',
    content: [
      'An old Android smartphone (Android 8.0+, min 3GB RAM)',
      'Node.js 18+ installed on your computer',
      'An Anthropic API key (get one at console.anthropic.com)',
      'Git installed on your system',
    ],
    type: 'list' as const,
  },
  {
    id: 'installation',
    title: 'Installation',
    icon: '⚙️',
    content: codeSteps,
    type: 'code' as const,
  },
  {
    id: 'first-run',
    title: 'First Run',
    icon: '🚀',
    content: [
      'After setup, JARVIS will greet you via Telegram or the web UI.',
      'Try sending: "Hello JARVIS, what can you do?"',
      'Explore personas by typing: /persona list',
      'Enable coding mode: /mode code',
    ],
    type: 'list' as const,
  },
  {
    id: 'next-steps',
    title: 'Next Steps',
    icon: '🗺️',
    content: [
      'Read the full Installation guide for advanced configuration.',
      'Explore the Architecture overview to understand how JARVIS works.',
      'Check the API Reference for programmatic access.',
      'Join the Discord community for tips and support.',
    ],
    type: 'list' as const,
  },
]

export default async function QuickstartPage() {
  const config = await getConfig()
  const page = config.docs.pages.quickstart as {
    title?: string
    icon?: string
    content?: string
  } | undefined
  const sidebar = config.docs.sidebar

  const pageTitle = page?.title ?? 'Quick Start'
  const pageIcon = page?.icon ?? '🚀'

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
                  const isActive = item.slug === 'quickstart'
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
              Get MyLittleJarvis running on your old phone in under 3 minutes.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#00D4AA]/10 text-accent-primary border border-[#00D4AA]/20 rounded-full px-3 py-1">
                ⏱ ~3 minutes
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-secondary border border-[#2A2A34] rounded-full px-3 py-1">
                📱 Android 8.0+
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-secondary border border-[#2A2A34] rounded-full px-3 py-1">
                🟢 Node.js 18+
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
                    {(section.content as typeof codeSteps).map((step, i) => (
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
              </section>
            ))}
          </div>

          {/* Next / Prev navigation */}
          <div className="mt-14 pt-8 border-t border-bg-tertiary grid grid-cols-2 gap-4">
            <Link
              href="/docs"
              className="group flex flex-col p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">← Previous</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                🏠 Introduction
              </span>
            </Link>
            <Link
              href="/docs/install"
              className="group flex flex-col items-end p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">Next →</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                ⚙️ Installation
              </span>
            </Link>
          </div>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-[#606070]">
            Having trouble?{' '}
            <a
              href="https://github.com/mylittlejarvis/jarvis-agent/issues"
              target="_blank"
              rel="noreferrer"
              className="text-accent-primary hover:underline"
            >
              Open an issue on GitHub
            </a>{' '}
            or join our{' '}
            <a href="#" className="text-accent-primary hover:underline">
              Discord community
            </a>
            .
          </p>
        </main>
      </div>
      <Footer config={config} />
    </div>
  )
}
