import { getConfig } from '@/lib/server-config'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export const metadata: Metadata = {
  title: 'Community - MyLittleJarvis Docs',
  description: 'Join the MyLittleJarvis community for support, discussions, and collaboration.',
}

const channels = [
  {
    id: 'discord',
    icon: '💬',
    name: 'Discord Server',
    description: 'Real-time chat with the community. Get help, share setups, and discuss features.',
    link: '#',
    linkLabel: 'Join Discord',
    badge: 'Most Active',
    badgeColor: '#00D4AA',
    stats: '1.2k members',
  },
  {
    id: 'github',
    icon: '🐙',
    name: 'GitHub Discussions',
    description: 'Long-form discussions, feature requests, and show-and-tell posts.',
    link: 'https://github.com/mylittlejarvis/jarvis-agent/discussions',
    linkLabel: 'Open GitHub',
    badge: 'Open Source',
    badgeColor: '#8B5CF6',
    stats: '300+ threads',
  },
  {
    id: 'reddit',
    icon: '🔴',
    name: 'r/MyLittleJarvis',
    description: 'Community-run subreddit for tips, projects, and general conversation.',
    link: '#',
    linkLabel: 'Visit Reddit',
    badge: 'Community',
    badgeColor: '#F97316',
    stats: '800+ members',
  },
  {
    id: 'twitter',
    icon: '🐦',
    name: 'Twitter / X',
    description: 'Follow for release announcements, tips, and community highlights.',
    link: '#',
    linkLabel: 'Follow @jarvisai',
    badge: 'Updates',
    badgeColor: '#38BDF8',
    stats: '@jarvisai',
  },
]

const guidelines = [
  {
    icon: '🤝',
    title: 'Be Respectful',
    desc: 'Treat everyone with kindness. Disagreements are fine; personal attacks are not.',
  },
  {
    icon: '🔍',
    title: 'Search First',
    desc: 'Before posting a question, check if it has already been answered in the docs or forums.',
  },
  {
    icon: '📝',
    title: 'Be Specific',
    desc: 'Include error messages, OS version, and steps to reproduce when reporting issues.',
  },
  {
    icon: '🚫',
    title: 'No Spam',
    desc: 'Self-promotion and off-topic content should go in the designated channels.',
  },
]

const contributions = [
  {
    icon: '🐛',
    title: 'Report Bugs',
    desc: 'Found something broken? Open an issue on GitHub with a clear reproduction.',
    href: 'https://github.com/mylittlejarvis/jarvis-agent/issues',
    label: 'Open Issue',
  },
  {
    icon: '💡',
    title: 'Suggest Features',
    desc: 'Have an idea? Start a GitHub Discussion or vote on existing proposals.',
    href: 'https://github.com/mylittlejarvis/jarvis-agent/discussions',
    label: 'Start Discussion',
  },
  {
    icon: '📖',
    title: 'Improve Docs',
    desc: 'Spotted a typo or missing info? Every docs page has an "Edit on GitHub" link.',
    href: 'https://github.com/mylittlejarvis/jarvis-agent',
    label: 'Edit Docs',
  },
  {
    icon: '🔧',
    title: 'Submit a PR',
    desc: 'Fix bugs or build new features. Check the contributing guide first.',
    href: 'https://github.com/mylittlejarvis/jarvis-agent/blob/main/CONTRIBUTING.md',
    label: 'Contributing Guide',
  },
]

export default async function CommunityPage() {
  const config = await getConfig()
  const page = config.docs.pages.community as {
    title?: string
    icon?: string
    content?: string
  } | undefined
  const sidebar = config.docs.sidebar

  const pageTitle = page?.title ?? 'Community'
  const pageIcon = page?.icon ?? '👥'
  const pageContent = page?.content ?? 'Join the MyLittleJarvis community for support and discussions.'

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
                  const isActive = item.slug === 'community'
                  return (
                    <li key={item.slug ?? '_index'}>
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
              <h1 className="text-3xl font-bold text-white tracking-tight">{pageTitle}</h1>
            </div>
            <p className="text-text-secondary text-lg leading-relaxed">{pageContent}</p>
          </div>

          {/* Community channels */}
          <section id="channels" className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-bg-tertiary">
              Where to Find Us
            </h2>
            <div className="grid gap-4">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-start gap-4 p-5 rounded-xl border border-bg-tertiary bg-[#0D0D15] hover:border-[#2A2A34] transition-colors"
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">{ch.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-white font-semibold">{ch.name}</h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full border font-medium"
                        style={{
                          color: ch.badgeColor,
                          borderColor: `${ch.badgeColor}33`,
                          backgroundColor: `${ch.badgeColor}11`,
                        }}
                      >
                        {ch.badge}
                      </span>
                      <span className="text-xs text-[#606070] ml-auto">{ch.stats}</span>
                    </div>
                    <p className="text-text-secondary text-sm mb-3">{ch.description}</p>
                    <a
                      href={ch.link}
                      target={ch.link.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-accent-primary hover:underline font-medium"
                    >
                      {ch.linkLabel} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Contributing */}
          <section id="contributing" className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-2 pb-2 border-b border-bg-tertiary">
              Contributing
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              MyLittleJarvis is open source and welcomes contributions of all kinds.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {contributions.map((c) => (
                <a
                  key={c.icon}
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col gap-2 p-5 rounded-xl border border-bg-tertiary bg-[#0D0D15] hover:border-[#00D4AA]/30 hover:bg-[#00D4AA]/5 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{c.icon}</span>
                    <span className="font-semibold text-white group-hover:text-accent-primary transition-colors">
                      {c.title}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">{c.desc}</p>
                  <span className="text-xs text-accent-primary font-medium mt-auto">{c.label} →</span>
                </a>
              ))}
            </div>
          </section>

          {/* Community guidelines */}
          <section id="guidelines" className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-bg-tertiary">
              Community Guidelines
            </h2>
            <div className="space-y-3">
              {guidelines.map((g) => (
                <div
                  key={g.icon}
                  className="flex items-start gap-3 p-4 rounded-xl border border-bg-tertiary bg-[#0D0D15]"
                >
                  <span className="text-xl flex-shrink-0">{g.icon}</span>
                  <div>
                    <p className="text-white font-medium mb-0.5">{g.title}</p>
                    <p className="text-text-secondary text-sm">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA banner */}
          <div className="mb-10 p-6 rounded-xl border border-[#00D4AA]/20 bg-[#00D4AA]/5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-white font-semibold mb-1">Ready to join?</p>
              <p className="text-text-secondary text-sm">
                Hop into Discord — the fastest way to get help and connect with other JARVIS users.
              </p>
            </div>
            <a
              href="#"
              className="flex-shrink-0 px-5 py-2.5 rounded-lg bg-[#00D4AA] text-[#0A0A0F] font-semibold text-sm hover:bg-[#00BF9A] transition-colors"
            >
              Join Discord
            </a>
          </div>

          {/* Prev / Next navigation */}
          <div className="mt-14 pt-8 border-t border-bg-tertiary grid grid-cols-2 gap-4">
            <Link
              href="/docs/troubleshooting"
              className="group flex flex-col p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">← Previous</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                🔧 Troubleshooting
              </span>
            </Link>
            <div />
          </div>
        </main>
      </div>
      <Footer config={config} />
    </div>
  )
}
