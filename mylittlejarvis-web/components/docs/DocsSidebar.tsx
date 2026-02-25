'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DocsSidebarSection } from '@/lib/config-types'

interface DocsSidebarProps {
  sidebar: {
    title: string
    sections: DocsSidebarSection[]
  }
  currentSlug: string
  onNavigate?: () => void
}

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
    <div className="mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-[#606070] text-xs uppercase tracking-wider mb-2 px-2 hover:text-[#A0A0B0] transition-colors"
      >
        <span>{section.title}</span>
        {section.collapsed !== undefined && (
          <span
            className={`transition-transform duration-200 text-[10px] ${open ? 'rotate-90' : ''}`}
          >
            ›
          </span>
        )}
      </button>

      {open && (
        <ul className="space-y-0.5">
          {section.items.map((item) => {
            const href = item.slug ? `/docs/${item.slug}` : '/docs'
            const isActive = item.slug === currentSlug

            return (
              <li key={item.slug || 'index'}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[#00D4AA]/10 text-[#00D4AA] font-medium'
                      : 'text-[#A0A0B0] hover:text-white hover:bg-[#1A1A24]'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function DocsSidebar({ sidebar, currentSlug, onNavigate }: DocsSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 fixed h-[calc(100vh-72px)] top-[72px] overflow-y-auto border-r border-[#1A1A24] py-8 px-4">
      <p className="text-[#A0A0B0] text-xs font-semibold uppercase tracking-wider mb-4">
        {sidebar.title}
      </p>

      {sidebar.sections.map((section) => (
        <SidebarSection
          key={section.title}
          section={section}
          currentSlug={currentSlug}
          onNavigate={onNavigate}
        />
      ))}
    </aside>
  )
}
