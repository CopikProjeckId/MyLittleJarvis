'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import type { SiteConfig } from '@/lib/config-types'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [activeTab, setActiveTab] = useState('site')
  const [jsonText, setJsonText] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || new URLSearchParams(window.location.search).get('token')
    if (token === process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfig()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const handleLogin = () => {
    if (tokenInput === process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
      localStorage.setItem('admin_token', tokenInput)
      setIsAuthenticated(true)
      setLoading(true)
    } else {
      alert('Invalid access token.')
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const data: SiteConfig = await response.json()
        setConfig(data)
        setJsonText(JSON.stringify(data, null, 2))
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      const parsed = JSON.parse(jsonText)
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      })
      
      if (response.ok) {
        setConfig(parsed)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      alert('Invalid JSON! Please check your syntax.')
    }
  }

  const tabs = [
    { id: 'site', label: '🌐 Site Info', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'navigation', label: '🧭 Navigation', color: 'bg-green-500/20 text-green-400' },
    { id: 'home', label: '🏠 Home Page', color: 'bg-purple-500/20 text-purple-400' },
    { id: 'about', label: '👥 About Page', color: 'bg-orange-500/20 text-orange-400' },
    { id: 'faq', label: '❓ FAQ Page', color: 'bg-pink-500/20 text-pink-400' },
    { id: 'footer', label: '🦶 Footer', color: 'bg-gray-500/20 text-gray-400' },
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 w-full max-w-sm space-y-4">
          <h1 className="text-white text-xl font-semibold text-center">Admin Access</h1>
          <input
            type="password"
            placeholder="Enter Access Token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-2 bg-[#0A0A0F] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4AA]"
          />
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 bg-[#00D4AA] text-black font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#00D4AA] text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {config && <Header config={config} />}

      {/* Admin toolbar */}
      <div className="bg-[#0A0A0F] border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">/</span>
            <span className="text-[#00D4AA] font-semibold">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            {saved && (
              <span className="text-green-400 text-sm">✓ Saved!</span>
            )}
            <button
              onClick={saveConfig}
              className="px-4 py-2 bg-[#00D4AA] text-black font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors"
            >
              💾 Save Changes
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors border border-white/10"
            >
              ← Back to Site
            </Link>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0A0A0F] border-r border-white/10 min-h-[calc(100vh-80px)] p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${tab.color}`}>
                  {tab.label.split(' ')[0]}
                </span>
                {tab.label.split(' ').slice(1).join(' ')}
              </button>
            ))}
          </nav>

          <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-white font-semibold mb-2">📄 subscript-config.json</h3>
            <p className="text-gray-400 text-sm mb-3">
              All website content is managed through this configuration file.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([jsonText], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'subscript-config.json'
                  a.click()
                }}
                className="flex-1 px-3 py-2 bg-white/5 text-white text-sm rounded hover:bg-white/10 transition-colors border border-white/10"
              >
                ⬇ Export
              </button>
              <label className="flex-1 px-3 py-2 bg-white/5 text-white text-sm rounded hover:bg-white/10 transition-colors border border-white/10 cursor-pointer text-center">
                ⬆ Import
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const text = event.target?.result as string
                        setJsonText(text)
                      }
                      reader.readAsText(file)
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* JSON Editor */}
            <div className="bg-[#0A0A0F] border border-white/10 rounded-xl overflow-hidden">
              <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-white font-semibold">📝 JSON Editor</h2>
                <span className="text-gray-500 text-sm">{activeTab}</span>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full h-[600px] bg-[#0A0A0F] text-gray-300 p-4 font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>

            {/* Preview */}
            <div className="bg-[#0A0A0F] border border-white/10 rounded-xl overflow-hidden">
              <div className="bg-white/5 px-4 py-3 border-b border-white/10">
                <h2 className="text-white font-semibold">👁 Preview</h2>
              </div>
              <div className="h-[600px] overflow-auto p-4">
                {config && (
                  <div className="space-y-4">
                    {activeTab === 'site' && (
                      <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-lg">
                          <label className="text-gray-400 text-sm">Site Name</label>
                          <p className="text-white text-lg font-semibold">{config.site.name}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                          <label className="text-gray-400 text-sm">Tagline</label>
                          <p className="text-white">{config.site.tagline}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                          <label className="text-gray-400 text-sm">Description</label>
                          <p className="text-gray-300 text-sm">{config.site.description}</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'navigation' && (
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(config.navigation).map(([key, value]) => (
                          <div key={key} className="bg-white/5 p-3 rounded-lg">
                            <label className="text-gray-400 text-xs uppercase">{key}</label>
                            <p className="text-white">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'home' && (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-[#00D4AA]/20 to-purple-500/20 p-4 rounded-lg border border-[#00D4AA]/20">
                          <h3 className="text-[#00D4AA] font-semibold mb-2">Hero Section</h3>
                          <p className="text-white text-lg">{config.home.hero.title} <span className="text-[#00D4AA]">{config.home.hero.titleHighlight}</span></p>
                          <p className="text-gray-400 text-sm mt-2">{config.home.hero.subtitle}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                          <h3 className="text-white font-semibold mb-2">Features ({config.home.features.cards.length} cards)</h3>
                          <p className="text-gray-400 text-sm">{config.home.features.title}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                          <h3 className="text-white font-semibold mb-2">Installation Steps ({config.home.installation.steps.length} steps)</h3>
                          <p className="text-gray-400 text-sm">{config.home.installation.title}</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'about' && (
                      <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-lg">
                          <h3 className="text-white font-semibold">{config.about.hero.title}</h3>
                          <p className="text-gray-400 text-sm mt-2">{config.about.hero.subtitle}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                          <h3 className="text-[#00D4AA] font-semibold">Team Members</h3>
                          <div className="mt-2 space-y-2">
                            {config.about.team.members.map((m: any, i: number) => (
                              <div key={i} className="text-sm">
                                <span className="text-white font-medium">{m.name}</span>
                                <span className="text-gray-500"> — {m.role}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'faq' && (
                      <div className="space-y-3">
                        <div className="bg-white/5 p-4 rounded-lg">
                          <h3 className="text-white font-semibold">{config.faq.hero.title}</h3>
                          <p className="text-gray-400 text-sm">{config.faq.questions.length} questions configured</p>
                        </div>
                        {config.faq.questions.slice(0, 3).map((q: any, i: number) => (
                          <div key={i} className="bg-white/5 p-3 rounded-lg border-l-2 border-[#00D4AA]">
                            <p className="text-white text-sm font-medium">Q: {q.question}</p>
                            <p className="text-gray-400 text-xs mt-1 truncate">{q.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'footer' && (
                      <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-lg">
                          <h3 className="text-[#00D4AA] font-semibold text-lg">{config.footer.brand}</h3>
                          <p className="text-gray-400 text-sm mt-2">{config.footer.description}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                          <p className="text-gray-500 text-sm">{config.footer.copyright}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      {config && <Footer config={config} />}
    </div>
  )
}
