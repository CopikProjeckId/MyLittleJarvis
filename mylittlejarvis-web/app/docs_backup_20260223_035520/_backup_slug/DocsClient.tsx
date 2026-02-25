'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { DocsSidebar } from '@/components/docs/DocsSidebar'
import { DocsContent } from '@/components/docs/DocsContent'

interface DocsClientProps {
  slug: string
  sidebar: {
    title: string
    sections: Array<{
      title: string
      items: Array<{
        slug: string
        title: string
        icon: string
      }>
    }>
  }
}

export function DocsClient({ slug, sidebar }: DocsClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="docs-container">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-bg-primary/80 backdrop-blur-md border-b border-bg-tertiary z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#00B4D8] flex items-center justify-center">
              <span className="text-[#0A0A0F] font-bold">🤖</span>
            </div>
            <span className="text-white font-semibold">MyLittleJarvis</span>
          </a>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <a href="/docs" className="text-[#00D4AA] text-sm">Docs</a>
              <a href="/" className="text-text-secondary text-sm hover:text-white transition-colors">Home</a>
              <a href="https://github.com/mylittlejarvis" target="_blank" className="text-text-secondary text-sm hover:text-white transition-colors">GitHub</a>
            </nav>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-11 h-11 flex items-center justify-center rounded-lg bg-[#1A1A24] text-text-secondary hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="pt-16 flex max-w-7xl mx-auto">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 fixed h-[calc(100vh-4rem)] overflow-y-auto border-r border-bg-tertiary py-8 px-4">
          <DocsSidebar sidebar={sidebar} currentSlug={slug} onNavigate={() => setMobileMenuOpen(false)} />
        </aside>

        {/* Sidebar - Mobile */}
        <aside 
          className={`fixed lg:hidden w-80 h-[calc(100vh-4rem)] overflow-y-auto border-r border-bg-tertiary py-8 px-4 bg-bg-primary z-50 transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <DocsSidebar sidebar={sidebar} currentSlug={slug} onNavigate={() => setMobileMenuOpen(false)} />
        </aside>

        {/* Content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-6 py-8 max-w-4xl w-full">
          <DocsContent slug={slug} />
        </main>
      </div>
    </div>
  )
}
