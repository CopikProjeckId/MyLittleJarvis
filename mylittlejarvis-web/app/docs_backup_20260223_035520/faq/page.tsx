import { getConfig } from '@/lib/server-config'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export const metadata: Metadata = {
  title: 'FAQ - MyLittleJarvis Docs',
  description: 'Frequently asked questions about MyLittleJarvis.',
}

const faqs = [
  {
    category: 'General',
    icon: '💬',
    items: [
      {
        q: 'What is MyLittleJarvis?',
        a: 'MyLittleJarvis is an open-source AI assistant that runs on an old Android smartphone, turning it into a personal always-on AI agent powered by Claude.',
      },
      {
        q: 'Is MyLittleJarvis free to use?',
        a: 'The software is free and open-source. You only pay for the Anthropic API usage, which follows a pay-per-token model. Running costs are typically very low for personal use.',
      },
      {
        q: 'Do I need a powerful phone?',
        a: 'No. Any Android 8.0+ phone with at least 3 GB of RAM works. JARVIS is designed to breathe new life into old or spare devices.',
      },
    ],
  },
  {
    category: 'Setup & Installation',
    icon: '⚙️',
    items: [
      {
        q: 'What operating systems are supported for the host machine?',
        a: 'The host server script runs on macOS, Linux, and Windows (via WSL2). The phone itself must be Android 8.0 or newer.',
      },
      {
        q: 'How do I get an Anthropic API key?',
        a: 'Visit console.anthropic.com, create an account, and generate an API key from the dashboard. Add it to your .env file as ANTHROPIC_API_KEY.',
      },
      {
        q: 'Can I run multiple JARVIS instances?',
        a: 'Yes. Each instance needs its own API key and configuration. You can run them on separate phones or as separate processes on the same machine.',
      },
    ],
  },
  {
    category: 'Features & Usage',
    icon: '🚀',
    items: [
      {
        q: 'How do I switch personas?',
        a: 'Send /persona list to see all available personas, then /persona set <name> to activate one. Personas change JARVIS\'s communication style and focus area.',
      },
      {
        q: 'Can JARVIS execute code on my machine?',
        a: 'Yes, when running in code mode (/mode code), JARVIS can write and execute scripts in a sandboxed environment. Review the security guide before enabling this.',
      },
      {
        q: 'Does JARVIS work without an internet connection?',
        a: 'JARVIS requires internet access for the Claude API. Local file operations and cached responses work offline, but AI generation needs connectivity.',
      },
    ],
  },
  {
    category: 'Privacy & Security',
    icon: '🔒',
    items: [
      {
        q: 'Where is my data stored?',
        a: 'Conversation history is stored locally on your device or host machine. No data is sent to MyLittleJarvis servers — only your API calls go to Anthropic.',
      },
      {
        q: 'Is my API key safe?',
        a: 'Your API key is stored only in your local .env file and is never transmitted to our servers. Keep the .env file out of version control by adding it to .gitignore.',
      },
      {
        q: 'Can I self-host the web UI?',
        a: 'Yes. The web interface is a standard Next.js app you can deploy anywhere — Vercel, a VPS, or your own server. See the deployment guide for details.',
      },
    ],
  },
]

export default async function FaqPage() {
  const config = await getConfig()
  const page = config.docs.pages.faq as {
    title?: string
    icon?: string
    hero?: { title?: string; subtitle?: string }
  } | undefined
  const sidebar = config.docs.sidebar

  const pageTitle = page?.title ?? 'FAQ'
  const pageIcon = page?.icon ?? '❓'
  const heroTitle = page?.hero?.title ?? 'Frequently Asked Questions'
  const heroSubtitle = page?.hero?.subtitle ?? 'Everything you need to know about MyLittleJarvis.'

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
                  const isActive = item.slug === 'faq'
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
            <span className="text-white">{pageTitle}</span>
          </nav>

          {/* Page title */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{pageIcon}</span>
              <h1 className="text-3xl font-bold text-white tracking-tight">{heroTitle}</h1>
            </div>
            <p className="text-text-secondary text-lg leading-relaxed">{heroSubtitle}</p>
          </div>

          {/* FAQ sections */}
          <div className="space-y-10">
            {faqs.map((group) => (
              <section key={group.category} id={group.category.toLowerCase().replace(/\s+/g, '-')}>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-5 pb-2 border-b border-bg-tertiary">
                  <span>{group.icon}</span>
                  <span>{group.category}</span>
                </h2>
                <div className="space-y-4">
                  {group.items.map((item, i) => (
                    <details
                      key={i}
                      className="group rounded-xl border border-bg-tertiary bg-[#0D0D15] overflow-hidden"
                    >
                      <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer text-white font-medium hover:bg-bg-tertiary/50 transition-colors list-none">
                        <span>{item.q}</span>
                        <span className="text-accent-primary flex-shrink-0 transition-transform group-open:rotate-180 text-lg leading-none">
                          ▾
                        </span>
                      </summary>
                      <div className="px-5 pb-5 pt-1 text-text-secondary leading-relaxed border-t border-bg-tertiary">
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-xl border border-[#00D4AA]/20 bg-[#00D4AA]/5 p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Still have questions?</h3>
            <p className="text-text-secondary mb-6">Check the documentation or reach out to the community.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/docs"
                className="px-5 py-2.5 rounded-lg bg-[#00D4AA] text-[#0A0A0F] font-semibold text-sm hover:bg-[#00B4D8] transition-colors"
              >
                Read Documentation
              </Link>
              <a
                href="#"
                className="px-5 py-2.5 rounded-lg border border-[#2A2A34] text-text-secondary text-sm hover:border-[#00D4AA]/30 hover:text-white transition-colors"
              >
                Join Discord
              </a>
            </div>
          </div>

          {/* Prev navigation */}
          <div className="mt-10 pt-8 border-t border-bg-tertiary flex justify-start">
            <Link
              href="/docs/architecture"
              className="group flex flex-col p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">← Previous</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                🏗️ Architecture
              </span>
            </Link>
          </div>
        </main>
      </div>

      <Footer config={config} />
    </div>
  )
}
