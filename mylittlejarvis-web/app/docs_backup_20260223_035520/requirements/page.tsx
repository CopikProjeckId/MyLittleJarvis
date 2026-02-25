import { getConfig } from '@/lib/server-config'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export const metadata: Metadata = {
  title: 'Requirements - MyLittleJarvis Docs',
  description: 'Hardware and software prerequisites for running MyLittleJarvis on your old Android phone.',
}

const sections = [
  {
    id: 'hardware',
    title: 'Hardware Requirements',
    icon: '📱',
    type: 'table' as const,
    rows: [
      { label: 'Device', value: 'Android smartphone (any brand)' },
      { label: 'Android Version', value: 'Android 8.0 (Oreo) or higher' },
      { label: 'RAM', value: 'Minimum 3 GB (4 GB+ recommended)' },
      { label: 'Storage', value: 'At least 8 GB free space' },
      { label: 'CPU', value: 'Quad-core 1.8 GHz or better' },
      { label: 'Battery', value: 'Works best plugged in (24/7 operation)' },
    ],
  },
  {
    id: 'software',
    title: 'Software Requirements',
    icon: '💻',
    type: 'table' as const,
    rows: [
      { label: 'Node.js', value: '18.0.0 or higher (LTS recommended)' },
      { label: 'npm / pnpm', value: 'npm 9+ or pnpm 8+' },
      { label: 'Git', value: '2.30 or higher' },
      { label: 'ADB (optional)', value: 'For USB debugging setup' },
      { label: 'Termux (on phone)', value: 'Latest version from F-Droid' },
    ],
  },
  {
    id: 'api-keys',
    title: 'API Keys & Accounts',
    icon: '🔑',
    type: 'list' as const,
    content: [
      'Anthropic API key — required for Claude AI. Get one at console.anthropic.com.',
      'Telegram Bot Token — required for Telegram interface. Create a bot via @BotFather.',
      'GitHub account (optional) — for Claude Code integration and repository access.',
      'Ollama (optional) — install locally for privacy-first, offline AI inference.',
    ],
  },
  {
    id: 'network',
    title: 'Network Requirements',
    icon: '🌐',
    type: 'list' as const,
    content: [
      'Stable internet connection on the host phone (Wi-Fi recommended).',
      'Port 3000 accessible for the web UI (or configure a different port).',
      'Port 4000 accessible for the API server.',
      'Outbound HTTPS to api.anthropic.com for Claude API calls.',
      'Outbound HTTPS to api.telegram.org if using the Telegram bot.',
    ],
  },
  {
    id: 'recommended',
    title: 'Recommended Setup',
    icon: '⭐',
    type: 'list' as const,
    content: [
      'Use a phone with 4+ GB RAM for running Ollama local models alongside JARVIS.',
      'Keep the phone plugged into power for continuous 24/7 operation.',
      'Use a dedicated Telegram bot token to avoid conflicts with other bots.',
      'Enable developer mode on Android for easier ADB debugging.',
      'Use a static local IP or mDNS hostname to avoid configuration changes.',
    ],
  },
]

export default async function RequirementsPage() {
  const config = await getConfig()
  const page = config.docs.pages.requirements as { title?: string; icon?: string } | undefined
  const sidebar = config.docs.sidebar

  const pageTitle = page?.title ?? 'Requirements'
  const pageIcon = page?.icon ?? '📋'

  return (
    <div className="docs-container font-['Space_Grotesk',sans-serif]">
      <Header config={config} />

      <div className="docs-layout">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 fixed h-[calc(100vh-72px)] overflow-y-auto border-r border-bg-tertiary py-8 px-4">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">{sidebar.title}</p>
          {sidebar.sections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="text-[#606070] text-xs uppercase tracking-wider mb-2">{section.title}</p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const href = item.slug ? `/docs/${item.slug}` : '/docs'
                  const isActive = item.slug === 'requirements'
                  return (
                    <li key={item.slug}>
                      <Link href={href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isActive ? 'bg-[#00D4AA]/10 text-accent-primary' : 'text-text-secondary hover:text-white hover:bg-bg-tertiary'
                        }`}>
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
          <nav className="flex items-center gap-2 text-sm text-[#606070] mb-8">
            <Link href="/docs" className="hover:text-accent-primary transition-colors">Docs</Link>
            <span>/</span>
            <span className="text-text-secondary">Getting Started</span>
            <span>/</span>
            <span className="text-white">{pageTitle}</span>
          </nav>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{pageIcon}</span>
              <h1 className="text-3xl font-bold text-white tracking-tight">{pageTitle}</h1>
            </div>
            <p className="text-text-secondary text-lg leading-relaxed">
              Everything you need before installing MyLittleJarvis — hardware specs, software versions, and API keys.
            </p>
          </div>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </h2>

                {section.type === 'table' && (
                  <div className="rounded-xl border border-bg-tertiary overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {section.rows.map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-[#0D0D15]' : 'bg-[#111118]'}>
                            <td className="px-4 py-3 text-text-secondary font-medium w-40">{row.label}</td>
                            <td className="px-4 py-3 text-[#C0C0D0]">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

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
              </section>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-bg-tertiary grid grid-cols-2 gap-4">
            <Link href="/docs/install"
              className="group flex flex-col p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all">
              <span className="text-xs text-[#606070] mb-1">← Previous</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">⚙️ Installation</span>
            </Link>
            <Link href="/docs/architecture"
              className="group flex flex-col items-end p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all">
              <span className="text-xs text-[#606070] mb-1">Next →</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">🏗️ Architecture</span>
            </Link>
          </div>

          <p className="mt-8 text-center text-xs text-[#606070]">
            Questions?{' '}
            <a href="https://github.com/mylittlejarvis/jarvis-agent/issues" target="_blank" rel="noreferrer"
              className="text-accent-primary hover:underline">Open an issue on GitHub</a>{' '}
            or join our <a href="#" className="text-accent-primary hover:underline">Discord community</a>.
          </p>
        </main>
      </div>
      <Footer config={config} />
    </div>
  )
}
