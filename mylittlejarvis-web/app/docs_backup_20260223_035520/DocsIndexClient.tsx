'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import type { SiteConfig, DocsSidebarSection, DocsIndexSection } from '@/lib/config'

function SidebarSection({
  section,
  currentSlug,
  onNavigate,
}: {
  section: DocsSidebarSection
  currentSlug: string
  onNavigate?: () => void
}) {
  const [open, setOpen] = useState(!section.collapsed)
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-widest text-text-secondary mb-2 px-2 hover:text-white transition-colors"
      >
        <span>{section.title}</span>
        {section.collapsed !== undefined && (
          <span className={`transition-transform duration-200 text-[10px] ${open ? 'rotate-90' : ''}`}>›</span>
        )}
      </button>
      {open && (
        <ul className="space-y-0.5 mb-4">
          {section.items.map((item) => {
            const href = item.slug ? `/docs/${item.slug}` : '/docs'
            const isActive = item.slug === currentSlug
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
      )}
    </div>
  )
}

function Sidebar({
  sections,
  currentSlug = '',
  onNavigate,
}: {
  sections: DocsSidebarSection[]
  currentSlug?: string
  onNavigate?: () => void
}) {
  return (
    <nav className="space-y-2">
      {sections.map((section) => (
        <SidebarSection
          key={section.title}
          section={section}
          currentSlug={currentSlug}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  )
}

export function DocsIndexClient({ config }: { config: SiteConfig }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { docs, navigation, footer } = config
  const indexPage = docs.pages.index as { title: string; subtitle: string; sections: DocsIndexSection[] }

  return (
    <div className="docs-container">
      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-bg-primary/80 backdrop-blur-md border-b border-bg-tertiary z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#00B4D8] flex items-center justify-center text-sm font-bold text-[#0A0A0F]">
              🤖
            </div>
            <span className="font-bold font-[family-name:var(--font-space-grotesk)] text-white">
              MyLittle<span className="text-[#00D4AA]">Jarvis</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/" className="text-text-secondary hover:text-white transition-colors">{navigation.home}</Link>
              <Link href="/docs" className="text-[#00D4AA] font-medium">{navigation.docs}</Link>
              <Link href="/about" className="text-text-secondary hover:text-white transition-colors">{navigation.about}</Link>
              <Link href="/faq" className="text-text-secondary hover:text-white transition-colors">{navigation.faq}</Link>
              <Link href="/blog" className="text-text-secondary hover:text-white transition-colors">{navigation.blog}</Link>
              <Link href="/changelog" className="text-text-secondary hover:text-white transition-colors">{navigation.changelog}</Link>
            </nav>
            <a
              href="https://github.com/mylittlejarvis"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex px-4 py-2 bg-[#00D4AA] text-black text-sm font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors"
            >
              {navigation.getStarted}
            </a>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-[#1A1A24] text-text-secondary hover:text-white transition-colors"
              aria-label="Toggle sidebar"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Layout ── */}
      <div className="pt-16 flex max-w-7xl mx-auto">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 fixed h-[calc(100vh-4rem)] overflow-y-auto border-r border-bg-tertiary py-8 px-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4AA] mb-6 px-2">
            {docs.sidebar.title}
          </p>
          <Sidebar sections={docs.sidebar.sections} currentSlug="" />
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
          <Sidebar sections={docs.sidebar.sections} currentSlug="" onNavigate={() => setMobileOpen(false)} />
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-8 py-12 max-w-4xl w-full">

          {/* ── Hero ── */}
          <section className="mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-[#00D4AA] text-xs font-medium mb-6">
              📖 Documentation
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-4 leading-tight">
              {indexPage.title}
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl leading-relaxed">
              {indexPage.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/docs/quickstart"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4AA] text-[#0A0A0F] font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors text-sm"
              >
                🚀 Quick Start
              </Link>
              <Link
                href="/docs/chat"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                💬 Chat Interface
              </Link>
              <Link
                href="/docs/api"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                📖 API Reference
              </Link>
            </div>
          </section>

          {/* ── Sections grid ── */}
          <section className="space-y-10">
            {indexPage.sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-1">
                  {section.title}
                </h2>
                <p className="text-sm text-text-secondary mb-5">{section.description}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.links.map((link) => (
                    <Link
                      key={link.slug}
                      href={`/docs/${link.slug}`}
                      className="group flex flex-col gap-2 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00D4AA]/40 hover:bg-white/[0.07] transition-all"
                    >
                      <span className="font-semibold text-white group-hover:text-[#00D4AA] transition-colors text-sm">
                        {link.title}
                      </span>
                      <span className="text-xs text-text-secondary leading-relaxed">{link.desc}</span>
                      <span className="text-[#00D4AA] text-xs mt-auto pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Read more →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* ── CTA banner ── */}
          <section className="mt-16 rounded-2xl bg-gradient-to-br from-[#00D4AA]/10 to-[#00B4D8]/10 border border-[#00D4AA]/20 p-8 text-center">
            <h3 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-2">
              Ready to get started?
            </h3>
            <p className="text-text-secondary mb-6 text-sm">
              Follow the Quick Start guide to have your JARVIS running in under 3 minutes.
            </p>
            <Link
              href="/docs/quickstart"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00D4AA] text-[#0A0A0F] font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors"
            >
              🚀 Get Started
            </Link>
          </section>
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="mt-24 py-10 px-4 border-t border-bg-tertiary text-center text-text-secondary text-sm">
        <p>{footer.copyright}</p>
      </footer>
    </div>
  )
}
