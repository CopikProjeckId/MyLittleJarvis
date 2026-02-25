'use client'

import { useEffect, useRef } from 'react'
import { Smartphone, Download, Key, Terminal, Cpu, UserCheck, Rocket, CheckCircle2 } from 'lucide-react'

const steps = [
  {
    icon: Smartphone,
    number: '01',
    title: 'Find Your Old Phone',
    description: 'Any Android device running Android 8.0+ with at least 3GB RAM. Dust off that Galaxy S8, Pixel 3, or OnePlus 5 sitting in a drawer.',
    tag: 'Hardware',
    detail: 'Tested on 200+ device models',
    tagColor: 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary',
  },
  {
    icon: Download,
    number: '02',
    title: 'Install ADB on Your Computer',
    description: 'Android Debug Bridge lets your computer talk to the phone. One installer handles everything automatically on Windows, Mac, or Linux.',
    tag: 'Setup',
    detail: 'Automated detection & install',
    tagColor: 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary',
    code: 'brew install android-platform-tools',
  },
  {
    icon: Terminal,
    number: '03',
    title: 'Enable USB Debugging',
    description: 'Tap "Build Number" 7 times in your phone settings to unlock Developer Mode, then enable USB Debugging. Our guide walks you through every screen.',
    tag: 'Phone Config',
    detail: '2-minute process with guide',
    tagColor: 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple',
  },
  {
    icon: Key,
    number: '04',
    title: 'Get Your Claude API Key',
    description: 'Sign up at Anthropic and grab your API key. The free tier gives you plenty to start, and JARVIS optimizes every token to minimize your costs.',
    tag: 'API Key',
    detail: 'Free tier available',
    tagColor: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
    code: 'sk-ant-api03-...',
  },
  {
    icon: Download,
    number: '05',
    title: 'Run the Installer',
    description: "One curl command handles everything: installs the runtime, configures the API bridge, deploys the app to your phone, and starts the service.",
    tag: 'Install',
    detail: 'Single command, fully automated',
    tagColor: 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary',
    code: 'curl -fsSL https://get.jarvis.sh | bash',
  },
  {
    icon: UserCheck,
    number: '06',
    title: 'Create Your Persona',
    description: 'Open the JARVIS web UI, upload writing samples, set your name, communication style, and knowledge areas. JARVIS learns who you are in minutes.',
    tag: 'Personalization',
    detail: '3-minute persona creation',
    tagColor: 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary',
  },
  {
    icon: Rocket,
    number: '07',
    title: 'JARVIS Goes Live',
    description: "Your JARVIS is online. Access it from any device on your network, set up mobile shortcuts, and start building the AI assistant you've always wanted.",
    tag: 'Launch',
    detail: 'Access from any device',
    tagColor: 'bg-status-success/10 border-status-success/30 text-status-success',
  },
]

export default function Installation() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    )

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section id="installation" className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-secondary/20 to-transparent pointer-events-none" />

      <div className="container-max section-padding relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="badge mx-auto mb-4">
            <Rocket className="w-3 h-3" />
            Quick Start
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4 tracking-tight">
            Up & Running in{' '}
            <span className="text-gradient">7 Steps</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            No prior DevOps experience needed. If you can plug in a USB cable, you can deploy JARVIS.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-3xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === steps.length - 1
            return (
              <div
                key={step.number}
                ref={(el) => { stepRefs.current[index] = el }}
                className="fade-up relative flex gap-5 group"
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                {/* Left column: number + connector line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  {/* Step circle */}
                  <div
                    className="relative w-11 h-11 rounded-full border-2 border-accent-primary/40
                               bg-bg-secondary flex items-center justify-center flex-shrink-0
                               group-hover:border-accent-primary group-hover:shadow-glow-sm
                               transition-all duration-300 z-10"
                  >
                    <Icon className="w-5 h-5 text-accent-primary" />
                    {/* Done checkmark overlay on completed steps */}
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-bg-primary border border-accent-primary/30 items-center justify-center hidden group-hover:flex">
                      <CheckCircle2 className="w-3 h-3 text-accent-primary" />
                    </div>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className="w-px flex-1 my-2 bg-gradient-to-b from-accent-primary/40 to-accent-primary/10 min-h-[40px]"
                    />
                  )}
                </div>

                {/* Right column: content */}
                <div className={`flex-1 pb-${isLast ? '0' : '8'} pb-8`}>
                  <div
                    className="bg-bg-secondary rounded-2xl p-5 border border-white/5
                               group-hover:border-accent-primary/20 group-hover:bg-bg-tertiary
                               transition-all duration-300 mb-0"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-text-tertiary">{step.number}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${step.tagColor}`}
                          >
                            {step.tag}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-white group-hover:text-accent-primary transition-colors">
                          {step.title}
                        </h3>
                      </div>
                      <span className="text-xs text-text-tertiary whitespace-nowrap bg-bg-primary rounded-lg px-2 py-1 border border-white/5 hidden sm:block">
                        {step.detail}
                      </span>
                    </div>

                    <p className="text-text-secondary text-sm leading-relaxed mb-3">
                      {step.description}
                    </p>

                    {step.code && (
                      <div className="bg-bg-primary rounded-lg px-4 py-2.5 font-mono text-xs border border-white/5">
                        <span className="text-text-tertiary select-none">$ </span>
                        <span className="text-accent-primary">{step.code}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-text-secondary text-sm mb-4">Ready to get started?</p>
          <button
            onClick={() => document.querySelector('#terminal')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Terminal className="w-4 h-4" />
            View Install Command
          </button>
        </div>
      </div>
    </section>
  )
}
