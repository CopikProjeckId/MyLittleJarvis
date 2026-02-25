'use client'

import { useEffect, useRef, useState } from 'react'
import { Github, Twitter, Youtube, MessageCircle, Mail, Heart } from 'lucide-react'

const stats = [
  { value: '1,234', label: 'Active Users' },
  { value: '5,678', label: 'Installs Completed' },
  { value: '890', label: 'Personas Shared' },
]

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Installation', href: '#install' },
    { label: 'Documentation', href: '/docs' },
    { label: 'GitHub', href: 'https://github.com/mylittlejarvis' },
  ],
  community: [
    { label: 'Discord', href: 'https://discord.gg/jarvis' },
    { label: 'Twitter', href: 'https://twitter.com/mylittlejarvis' },
    { label: 'YouTube', href: 'https://youtube.com/mylittlejarvis' },
    { label: 'Blog', href: '/blog' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
}

const socialLinks = [
  { icon: Github, href: 'https://github.com/mylittlejarvis', label: 'GitHub' },
  { icon: Twitter, href: 'https://twitter.com/mylittlejarvis', label: 'Twitter' },
  { icon: Youtube, href: 'https://youtube.com/mylittlejarvis', label: 'YouTube' },
  { icon: MessageCircle, href: 'https://discord.gg/jarvis', label: 'Discord' },
]

export default function Footer() {
  const [isVisible, setIsVisible] = useState(false)
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (footerRef.current) {
      observer.observe(footerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <footer
      ref={footerRef}
      className="relative bg-[#12121A] border-t border-[#1A1A24]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Stats Section */}
        <div
          className={`py-16 border-b border-[#1A1A24] transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`text-center transition-all duration-700 delay-${index * 100}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#00D4AA] to-[#00B4D8] bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-[#A0A0B0] text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Footer Content */}
        <div
          className={`py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#00B4D8] flex items-center justify-center">
                <span className="text-[#0A0A0F] font-bold text-xl">🤖</span>
              </div>
              <span className="text-xl font-bold text-white">MyLittleJarvis</span>
            </div>
            <p className="text-[#A0A0B0] text-sm mb-6 max-w-xs">
              Transform your old smartphone into an AI-powered personal assistant.
              Claude Code-level coding at 15% cost.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-[#1A1A24] flex items-center justify-center text-[#A0A0B0] hover:text-[#00D4AA] hover:bg-[#222230] transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[#A0A0B0] text-sm hover:text-[#00D4AA] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[#A0A0B0] text-sm hover:text-[#00D4AA] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[#A0A0B0] text-sm hover:text-[#00D4AA] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-[#1A1A24] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#6A6A80] text-sm">
            © 2026 MyLittleJarvis. Open source under MIT License.
          </p>
          <p className="text-[#6A6A80] text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by the community
          </p>
        </div>
      </div>
    </footer>
  )
}
