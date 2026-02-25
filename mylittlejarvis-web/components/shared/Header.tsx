'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Zap } from 'lucide-react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import type { SiteConfig } from '@/lib/server-config'

const NAV_ITEMS = [
  { key: 'home', href: '/' },
  { key: 'docs', href: 'https://docs.mylittlejarvis.com', external: true },
  { key: 'about', href: '/about' },
  { key: 'faq', href: '/faq' },
  { key: 'blog', href: '/blog' },
  { key: 'changelog', href: '/changelog' },
] as const

interface HeaderProps {
  config: SiteConfig
  activePage?: string
}

export default function Header({ config, activePage }: HeaderProps) {
  const pathname = usePathname()
  const currentPage = activePage ?? pathname
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const nav = config.navigation

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-[#00D4AA]/20 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
        style={{ height: '72px' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#00D4AA] rounded-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <Zap className="w-5 h-5 text-[#00D4AA] relative z-10" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk), Inter, sans-serif' }}>
              <span className="text-white">My</span>
              <span className="text-[#00D4AA]">Little</span>
              <span className="text-white">Jarvis</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_ITEMS.map(({ key, href }) => {
              const label = nav[key] ?? key
              const isActive = href === '/' ? currentPage === '/' : currentPage?.startsWith(href)
              return (
                <Link
                  key={key}
                  href={href}
                  className={`px-4 py-2 min-h-[44px] flex items-center text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-[#00D4AA] bg-[#00D4AA]/10'
                      : 'text-[#A0A0B0] hover:text-white hover:bg-[#1A1A24]'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <a
              href="https://github.com/mylittlejarvis"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm text-[#A0A0B0] hover:text-white transition-colors duration-200 font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
            <Link
              href="https://docs.mylittlejarvis.com"
              className="px-5 py-2 min-h-[44px] flex items-center text-sm font-semibold rounded-lg bg-[#00D4AA] text-[#0A0A0F] hover:bg-[#00D4AA]/90 transition-colors duration-200"
            >
              {nav.getStarted ?? 'Get Started'}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-[#A0A0B0] hover:text-white hover:bg-[#1A1A24] transition-all"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-out drawer */}
      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 bg-[#12121A] border-l border-[#00D4AA]/10
                    flex flex-col transition-transform duration-300 ease-in-out ${
                      mobileOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
        aria-label="Mobile navigation"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5" style={{ height: '72px' }}>
          <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <div className="relative w-7 h-7 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#00D4AA] rounded-md opacity-20" />
              <Zap className="w-4 h-4 text-[#00D4AA] relative z-10" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk), Inter, sans-serif' }}>
              <span className="text-white">My</span>
              <span className="text-[#00D4AA]">Little</span>
              <span className="text-white">Jarvis</span>
            </span>
          </Link>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#A0A0B0] hover:text-white hover:bg-[#1A1A24] transition-all"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ key, href }) => {
            const label = nav[key] ?? key
            const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(href)
            return (
              <Link
                key={key}
                href={href}
                className={`px-4 py-3 min-h-[48px] flex items-center text-base font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-[#00D4AA] bg-[#00D4AA]/10'
                    : 'text-[#A0A0B0] hover:text-white hover:bg-[#1A1A24]'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Drawer footer CTA */}
        <div className="px-4 py-5 border-t border-white/5 flex flex-col gap-3">
          <a
            href="https://github.com/mylittlejarvis"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-sm font-medium text-[#A0A0B0] hover:text-white rounded-lg hover:bg-[#1A1A24] transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
          <Link
            href="https://docs.mylittlejarvis.com"
            className="flex items-center justify-center px-4 py-3 min-h-[48px] text-sm font-semibold rounded-lg bg-[#00D4AA] text-[#0A0A0F] hover:bg-[#00D4AA]/90 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            {nav.getStarted ?? 'Get Started'}
          </Link>
        </div>
      </div>
    </>
  )
}
