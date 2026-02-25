'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Sparkles, Phone, Cpu } from 'lucide-react'

const badges = [
  { icon: '⚡', label: 'Claude AI Powered' },
  { icon: '📱', label: 'Any Old Phone' },
  { icon: '🚀', label: '3-Min Setup' },
]

export default function Hero() {
  const [mounted, setMounted] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Stagger-in on mount
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const scrollToInstall = () => {
    document.querySelector('#installation')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToFeatures = () => {
    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[72px]"
    >
      {/* Animated grid background */}
      <div className="absolute inset-0 grid-bg opacity-40" />

      {/* Gradient orbs */}
      <div
        className="hero-orb w-[600px] h-[600px] bg-accent-primary"
        style={{ top: '-100px', right: '-200px' }}
      />
      <div
        className="hero-orb w-[400px] h-[400px] bg-accent-purple"
        style={{ bottom: '-50px', left: '-100px' }}
      />
      <div
        className="hero-orb w-[300px] h-[300px] bg-accent-secondary"
        style={{ top: '40%', left: '30%' }}
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-bg-primary/60 to-bg-primary" />

      {/* Scanline effect */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #00D4AA, #00D4AA 1px, transparent 1px, transparent 4px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container-max section-padding text-center py-20">
        {/* Badges */}
        <div
          className={`flex flex-wrap items-center justify-center gap-3 mb-8 transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {badges.map((badge, i) => (
            <span
              key={badge.label}
              className="badge text-sm md:text-base"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className="text-lg">{badge.icon}</span>
              {badge.label}
            </span>
          ))}
        </div>

        {/* Main Headline */}
        <div
          className={`transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h1
            className="font-display font-extrabold leading-[1.05] tracking-tight mb-6"
            style={{ fontSize: 'clamp(40px, 7vw, 80px)' }}
          >
            <span className="block text-white">Your Old Phone</span>
            <span className="block text-white">Becomes Your</span>
            <span className="block text-gradient neon-text">JARVIS</span>
          </h1>
        </div>

        {/* Subtitle */}
        <p
          className={`text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed
                      transition-all duration-700 delay-300 ${
                        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                      }`}
        >
          Transform any old Android device into a 24/7 AI powerhouse.
          Claude Code-level intelligence at{' '}
          <span className="text-accent-primary font-semibold">15% of the cost.</span>
          {' '}Your personal AI persona, live in minutes.
        </p>

        {/* CTA Buttons */}
        <div
          className={`flex flex-wrap items-center justify-center gap-4 mb-16
                      transition-all duration-700 delay-400 ${
                        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                      }`}
        >
          <button
            onClick={scrollToInstall}
            className="glow-button group flex items-center gap-2 bg-accent-primary text-bg-primary
                       font-bold px-8 py-4 min-h-[48px] rounded-xl text-base md:text-lg transition-all duration-300
                       hover:shadow-glow-lg hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
            Get Started Free
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={scrollToFeatures}
            className="flex items-center gap-2 btn-secondary px-8 py-4 min-h-[48px] rounded-xl text-base md:text-lg"
          >
            See How It Works
          </button>
        </div>

        {/* Hero Visual — Phone + AI display */}
        <div
          className={`relative max-w-3xl mx-auto transition-all duration-1000 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="glass-card rounded-2xl p-1 shadow-glow-sm">
            {/* Browser chrome */}
            <div className="bg-bg-elevated rounded-xl overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-status-error/70" />
                  <div className="w-3 h-3 rounded-full bg-status-warning/70" />
                  <div className="w-3 h-3 rounded-full bg-status-success/70" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-bg-tertiary rounded-md px-3 py-1.5 text-xs text-text-tertiary font-mono flex items-center gap-2">
                    <span className="text-status-success">●</span>
                    jarvis.local:8080
                  </div>
                </div>
              </div>

              {/* Fake JARVIS interface */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 min-h-[200px]">
                {/* Left panel */}
                <div className="sm:col-span-1 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                    <span className="text-xs text-text-tertiary font-mono">JARVIS ONLINE</span>
                  </div>
                  {[
                    { label: 'CPU', value: '12%', color: 'bg-status-success' },
                    { label: 'Memory', value: '847MB', color: 'bg-accent-secondary' },
                    { label: 'Tasks', value: '3 active', color: 'bg-accent-purple' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-bg-tertiary rounded-lg p-3">
                      <div className="text-xs text-text-tertiary mb-1">{stat.label}</div>
                      <div className="text-sm font-mono text-text-primary">{stat.value}</div>
                      <div className="mt-2 h-1 bg-bg-elevated rounded-full overflow-hidden">
                        <div
                          className={`h-full ${stat.color} rounded-full`}
                          style={{ width: stat.label === 'CPU' ? '12%' : stat.label === 'Memory' ? '65%' : '40%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right panel — Chat */}
                <div className="sm:col-span-2 flex flex-col gap-2">
                  <div className="text-xs text-text-tertiary font-mono mb-1">CONVERSATION</div>
                  <div className="bg-bg-tertiary rounded-lg p-3 ml-auto max-w-xs">
                    <p className="text-sm text-text-primary">Remind me about my 3pm meeting and summarize the docs I sent</p>
                    <span className="text-xs text-text-tertiary mt-1 block">You · just now</span>
                  </div>
                  <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-text-primary">
                      <span className="text-accent-primary font-medium">JARVIS:</span> Got it! Reminder set for 3:00 PM. I've analyzed the 3 documents — here's the key insight: the Q4 projections show 34% growth. Want me to prepare talking points?
                    </p>
                    <span className="text-xs text-text-tertiary mt-1 block">JARVIS · 0.8s</span>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="flex-1 bg-bg-tertiary rounded-lg px-3 py-2 text-sm text-text-tertiary">
                      Ask JARVIS anything...
                    </div>
                    <button className="bg-accent-primary text-bg-primary p-2 rounded-lg">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -top-4 -right-4 glass-card rounded-xl px-3 py-2 flex items-center gap-2 animate-float shadow-glow-sm">
            <Cpu className="w-4 h-4 text-accent-primary" />
            <span className="text-xs font-mono text-text-primary">Claude 3.5 Sonnet</span>
          </div>
          <div className="absolute -bottom-4 -left-4 glass-card rounded-xl px-3 py-2 flex items-center gap-2 shadow-card"
               style={{ animationDelay: '2s' }}>
            <Phone className="w-4 h-4 text-accent-secondary" />
            <span className="text-xs font-mono text-text-primary">Galaxy S9 → JARVIS</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
          <span className="text-xs text-text-tertiary font-mono">scroll to explore</span>
          <div className="w-5 h-8 border border-text-tertiary/40 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-accent-primary rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  )
}
