'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Zap } from 'lucide-react'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Terminal', href: '#terminal' },
  { label: 'Install', href: '#installation' },
  { label: 'Docs', href: '/docs', isExternal: true },
  { label: 'About', href: '/about', isExternal: true },
  { label: 'FAQ', href: '/faq', isExternal: true },
  { label: 'Blog', href: '/blog', isExternal: true },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (href: string, isExternal?: boolean) => {
    setMobileOpen(false)
    if (isExternal) {
      window.location.href = href
      return
    }
    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-bg-primary/90 backdrop-blur-xl border-b border-accent-primary/20 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
      style={{ height: '72px' }}
    >
      <div className="container-max section-padding h-full flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 group"
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-accent-primary rounded-lg opacity-20 group-hover:opacity-40 transition-opacity" />
            <Zap className="w-5 h-5 text-accent-primary relative z-10" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            <span className="text-white">My</span>
            <span className="text-gradient">Little</span>
            <span className="text-white">Jarvis</span>
          </span>
        </button>

        {/* Desktop Links - 44px touch target */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href, link.isExternal)}
              className="px-4 py-2 min-h-[44px] flex items-center text-sm md:text-base text-text-secondary hover:text-text-primary rounded-lg
                         hover:bg-bg-tertiary transition-all duration-200 font-medium"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop CTA - 44px touch target */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com/mylittlejarvis"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm md:text-base text-text-secondary
                       hover:text-text-primary transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
          <button
            onClick={() => handleNavClick('#installation')}
            className="btn-primary text-sm md:text-base min-h-[44px] px-5"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Menu Toggle - 44px touch target */}
        <button
          className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary
                     hover:bg-bg-tertiary transition-all"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-bg-secondary/95 backdrop-blur-xl
                    border-b border-accent-primary/20 transition-all duration-300 overflow-hidden ${
                      mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
                    }`}
      >
        <div className="section-padding py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href, link.isExternal)}
              className="text-left px-4 py-3 min-h-[48px] flex items-center text-base text-text-secondary hover:text-text-primary
                         hover:bg-bg-tertiary rounded-lg transition-all duration-200 font-medium"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-white/5 mt-1">
            <button
              onClick={() => handleNavClick('#installation')}
              className="w-full btn-primary text-base min-h-[48px] text-center"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
