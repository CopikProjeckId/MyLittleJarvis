'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal as TerminalIcon, Copy, Check, Circle } from 'lucide-react'

const terminalLines = [
  { delay: 0, type: 'prompt', content: 'curl -fsSL https://get.jarvis.sh | bash' },
  { delay: 400, type: 'output', content: '' },
  { delay: 500, type: 'info', content: '  MyLittleJarvis Installer v1.0.0' },
  { delay: 600, type: 'dim', content: '  ─────────────────────────────────' },
  { delay: 800, type: 'output', content: '' },
  { delay: 900, type: 'step', content: '→ Checking system requirements...' },
  { delay: 1200, type: 'success', content: '  ✓ Android Debug Bridge (adb) detected' },
  { delay: 1400, type: 'success', content: '  ✓ Python 3.11 found' },
  { delay: 1600, type: 'success', content: '  ✓ USB debugging enabled on device' },
  { delay: 1800, type: 'output', content: '' },
  { delay: 1900, type: 'step', content: '→ Detecting connected devices...' },
  { delay: 2200, type: 'device', content: '  Found: Samsung Galaxy S9 (SM-G960F)' },
  { delay: 2400, type: 'dim', content: '  Android 10 · 6GB RAM · 64GB storage' },
  { delay: 2600, type: 'output', content: '' },
  { delay: 2700, type: 'step', content: '→ Installing JARVIS runtime...' },
  { delay: 3000, type: 'progress', content: '  [████████████████████] 100% done' },
  { delay: 3300, type: 'output', content: '' },
  { delay: 3400, type: 'step', content: '→ Configuring Claude API bridge...' },
  { delay: 3700, type: 'success', content: '  ✓ API key validated' },
  { delay: 3900, type: 'success', content: '  ✓ Model: claude-3-5-sonnet-20241022' },
  { delay: 4100, type: 'output', content: '' },
  { delay: 4200, type: 'step', content: '→ Deploying JARVIS to device...' },
  { delay: 4500, type: 'progress', content: '  [████████████████████] 100% done' },
  { delay: 4800, type: 'output', content: '' },
  { delay: 4900, type: 'accent', content: '  ┌─────────────────────────────────┐' },
  { delay: 5000, type: 'accent', content: '  │  🎉  JARVIS is now online!       │' },
  { delay: 5100, type: 'accent', content: '  │  ⚡  http://192.168.1.42:8080    │' },
  { delay: 5200, type: 'accent', content: '  └─────────────────────────────────┘' },
  { delay: 5400, type: 'output', content: '' },
  { delay: 5500, type: 'prompt', content: '_' },
]

const INSTALL_CMD = 'curl -fsSL https://get.jarvis.sh | bash'

export default function TerminalShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const [started, setStarted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return

    const timers: ReturnType<typeof setTimeout>[] = []
    terminalLines.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisibleLines((v) => v + 1)
        // Auto-scroll
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
      }, terminalLines[i].delay)
      timers.push(t)
    })

    return () => timers.forEach(clearTimeout)
  }, [started])

  const copyCommand = async () => {
    await navigator.clipboard.writeText(INSTALL_CMD)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getLineClass = (type: string) => {
    switch (type) {
      case 'prompt': return 'code-prompt font-semibold'
      case 'success': return 'code-success'
      case 'step': return 'text-accent-secondary font-medium'
      case 'accent': return 'code-accent font-semibold'
      case 'device': return 'text-accent-primary'
      case 'info': return 'text-white font-semibold'
      case 'dim': return 'code-dim'
      case 'progress': return 'text-status-success'
      default: return 'text-text-code'
    }
  }

  return (
    <section id="terminal" ref={sectionRef} className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-secondary/20 to-transparent pointer-events-none" />

      <div className="container-max section-padding relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="fade-up">
            <div className="badge mb-4">
              <TerminalIcon className="w-3 h-3" />
              Zero-Config Install
            </div>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-6 tracking-tight leading-tight">
              One Command.{' '}
              <span className="text-gradient">Fully Running.</span>
            </h2>
            <p className="text-text-secondary text-lg mb-8 leading-relaxed">
              No Docker. No cloud accounts. No configuration hell.
              Just plug in your old phone, run one command, and watch JARVIS come to life in under 5 minutes.
            </p>

            {/* Quick copy command */}
            <div className="flex items-center gap-0 mb-8">
              <div className="flex-1 bg-bg-secondary border border-white/10 rounded-l-xl px-4 py-3 font-mono text-sm text-text-code overflow-hidden">
                <span className="text-text-tertiary select-none">$ </span>
                <span className="text-accent-primary">{INSTALL_CMD}</span>
              </div>
              <button
                onClick={copyCommand}
                className="bg-accent-primary/10 border border-accent-primary/30 hover:bg-accent-primary/20
                           border-l-0 rounded-r-xl px-4 py-3 text-accent-primary transition-all duration-200
                           hover:border-accent-primary/60 flex items-center gap-2 text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-status-success" />
                    <span className="text-status-success hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Feature list */}
            <ul className="space-y-3">
              {[
                'Works on any Android 8+ device',
                'Local + API hybrid processing',
                'Automatic updates via git pull',
                'Open source — fork and customize',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-text-secondary text-sm">
                  <div className="w-5 h-5 rounded-full border border-accent-primary/40 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent-primary" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Terminal */}
          <div className="fade-up" style={{ transitionDelay: '200ms' }}>
            {/* Terminal window */}
            <div className="rounded-2xl overflow-hidden shadow-glow-sm border border-white/10 bg-[#0D1117]">
              {/* Title bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-status-error fill-status-error/60" />
                  <Circle className="w-3 h-3 text-status-warning fill-status-warning/60" />
                  <Circle className="w-3 h-3 text-status-success fill-status-success/60" />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-mono">
                  <TerminalIcon className="w-3.5 h-3.5" />
                  bash — 80×24
                </div>
                <div className="w-16" />
              </div>

              {/* Terminal content */}
              <div
                ref={terminalRef}
                className="p-5 font-mono text-sm leading-relaxed h-[400px] overflow-y-auto terminal-scroll"
                style={{ backgroundColor: '#0D1117' }}
              >
                {/* User info line */}
                <div className="mb-3">
                  <span className="text-[#3fb950]">user@macbook</span>
                  <span className="text-[#8b949e]">:</span>
                  <span className="text-[#58a6ff]">~/projects</span>
                  <span className="text-[#8b949e]">$ </span>
                </div>

                {/* Animated lines */}
                {terminalLines.slice(0, visibleLines).map((line, i) => (
                  <div key={i} className="min-h-[1.5rem]">
                    {line.content === '_' ? (
                      <span className="bg-accent-primary/80 text-transparent select-none animate-blink">▌</span>
                    ) : line.type === 'prompt' && i === 0 ? (
                      <div>
                        <span className="text-[#3fb950]">user@macbook</span>
                        <span className="text-[#8b949e]">:</span>
                        <span className="text-[#58a6ff]">~/projects</span>
                        <span className="text-[#8b949e]">$ </span>
                        <span className={getLineClass(line.type)}>{line.content}</span>
                      </div>
                    ) : (
                      <span className={getLineClass(line.type)}>{line.content}</span>
                    )}
                  </div>
                ))}

                {/* Typing cursor when not all lines shown */}
                {visibleLines > 0 && visibleLines < terminalLines.length && (
                  <span className="inline-block w-2 h-4 bg-accent-primary/80 animate-blink ml-0.5 -mb-1" />
                )}
              </div>
            </div>

            {/* Below terminal stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Install time', value: '<5 min' },
                { label: 'Bundle size', value: '12 MB' },
                { label: 'Dependencies', value: '3 only' },
              ].map((stat) => (
                <div key={stat.label} className="bg-bg-secondary rounded-xl p-3 text-center border border-white/5">
                  <div className="font-display font-bold text-base text-accent-primary">{stat.value}</div>
                  <div className="text-xs text-text-tertiary mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
