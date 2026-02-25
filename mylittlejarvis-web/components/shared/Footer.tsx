import Link from 'next/link'
import { Github, Twitter, Mail, MessageCircle } from 'lucide-react'
import type { SiteConfig } from '@/lib/config-types'

const linkHrefs: Record<string, string> = {
  Documentation: '/docs',
  Changelog: '/changelog',
  FAQ: '/faq',
  Blog: '/blog',
  About: '/about',
  GitHub: 'https://github.com/mylittlejarvis',
  Discord: 'https://discord.gg/jarvis',
  Twitter: 'https://twitter.com/mylittlejarvis',
  Email: 'mailto:hello@mylittlejarvis.com',
}

const connectIcons: Record<string, React.ElementType> = {
  Discord: MessageCircle,
  Twitter: Twitter,
  Email: Mail,
  GitHub: Github,
}

function isExternal(href: string) {
  return href.startsWith('http') || href.startsWith('mailto:')
}

export default function Footer({ config }: { config?: SiteConfig }) {
  if (!config) return null
  const { footer } = config

  return (
    <footer
      className="bg-[#0A0A0F] border-t border-white/10"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#00B4D8] flex items-center justify-center">
                <span className="text-[#0A0A0F] font-bold text-lg">🤖</span>
              </div>
              <span className="text-lg font-bold text-white">{footer.brand}</span>
            </div>
            <p className="text-[#A0A0B0] text-sm mb-6 max-w-xs leading-relaxed">
              {footer.description}
            </p>
            <div className="flex gap-3">
              {footer.links.connect.map((label) => {
                const Icon = connectIcons[label]
                const href = linkHrefs[label] ?? '#'
                if (!Icon) return null
                return (
                  <a
                    key={label}
                    href={href}
                    target={isExternal(href) ? '_blank' : undefined}
                    rel={isExternal(href) ? 'noopener noreferrer' : undefined}
                    aria-label={label}
                    className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#A0A0B0] hover:text-[#00D4AA] hover:bg-white/10 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-3">
              {footer.links.product.map((label) => {
                const href = linkHrefs[label] ?? '#'
                const external = isExternal(href)
                return (
                  <li key={label}>
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A0A0B0] text-sm hover:text-[#00D4AA] transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-[#A0A0B0] text-sm hover:text-[#00D4AA] transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-3">
              {footer.links.resources.map((label) => {
                const href = linkHrefs[label] ?? '#'
                const external = isExternal(href)
                return (
                  <li key={label}>
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A0A0B0] text-sm hover:text-[#00D4AA] transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-[#A0A0B0] text-sm hover:text-[#00D4AA] transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Connect
            </h4>
            <ul className="space-y-3">
              {footer.links.connect.map((label) => {
                const href = linkHrefs[label] ?? '#'
                const external = isExternal(href)
                return (
                  <li key={label}>
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A0A0B0] text-sm hover:text-[#00D4AA] transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-[#A0A0B0] text-sm hover:text-[#00D4AA] transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-[#6A6A80] text-sm text-center">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
