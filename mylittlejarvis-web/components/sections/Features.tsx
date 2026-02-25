'use client'

import { useEffect, useRef } from 'react'
import { Smartphone, DollarSign, User, ArrowRight, Zap, Code2, Brain } from 'lucide-react'

const features = [
  {
    icon: Smartphone,
    accentIcon: Zap,
    title: 'Old Phone + AI =',
    titleHighlight: 'Infinite Possibilities',
    description:
      'Breathe new life into that drawer-bound Galaxy S8 or iPhone X. MyLittleJarvis runs efficiently on any Android 8+ device, turning forgotten hardware into a always-on AI hub that works while you sleep.',
    badge: 'Hardware Recycle',
    stats: [
      { value: '200+', label: 'Compatible Devices' },
      { value: '24/7', label: 'Always On' },
    ],
    gradient: 'from-accent-primary/20 to-transparent',
    borderColor: 'border-accent-primary/20',
    hoverBorder: 'hover:border-accent-primary/50',
    codeSnippet: '$ adb install jarvis.apk\n✓ Device recognized: SM-G960F\n✓ JARVIS initialized',
  },
  {
    icon: Code2,
    accentIcon: DollarSign,
    title: 'Claude Code-Level Coding',
    titleHighlight: 'at 15% Cost',
    description:
      'Access the same Claude 3.5 Sonnet intelligence that powers elite developer workflows, routed through efficient local processing. Write, debug, and ship code faster — without the premium price tag.',
    badge: 'Cost Efficient',
    stats: [
      { value: '85%', label: 'Cost Reduction' },
      { value: '<1s', label: 'Response Time' },
    ],
    gradient: 'from-accent-secondary/20 to-transparent',
    borderColor: 'border-accent-secondary/20',
    hoverBorder: 'hover:border-accent-secondary/50',
    codeSnippet: '// Cost per 1M tokens\nAPI direct:  $15.00\nJARVIS:       $2.25\nSavings:      85% ↓',
  },
  {
    icon: Brain,
    accentIcon: User,
    title: 'Your Persona',
    titleHighlight: 'in 3 Minutes',
    description:
      'Train JARVIS to sound like you, think like you, and know everything you know. Upload your writing samples, set your preferences, and JARVIS becomes an extension of your own mind — not a generic chatbot.',
    badge: 'Personalized AI',
    stats: [
      { value: '3 min', label: 'Setup Time' },
      { value: '∞', label: 'Customization' },
    ],
    gradient: 'from-accent-purple/20 to-transparent',
    borderColor: 'border-accent-purple/20',
    hoverBorder: 'hover:border-accent-purple/50',
    codeSnippet: '> Loading persona: "Alex"\n> Tone: Technical, concise\n> Context: 47 docs loaded\n✓ Persona active',
  },
]

export default function Features() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="relative py-24 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-secondary/30 to-transparent pointer-events-none" />

      <div className="container-max section-padding relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="badge mx-auto mb-4">
            <Zap className="w-3 h-3" />
            Core Features
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4 tracking-tight">
            Everything You Need.{' '}
            <span className="text-gradient">Nothing You Don't.</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Three pillars that make MyLittleJarvis the most powerful personal AI setup for developers.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const AccentIcon = feature.accentIcon
            return (
              <div
                key={feature.badge}
                ref={(el) => { cardRefs.current[index] = el }}
                className={`fade-up feature-card relative bg-bg-secondary rounded-2xl p-6 border ${feature.borderColor} ${feature.hoverBorder} cursor-default overflow-hidden group`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Card gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-b ${feature.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative z-10">
                  {/* Badge */}
                  <span className="badge text-xs mb-5 inline-flex">{feature.badge}</span>

                  {/* Icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-bg-tertiary border border-white/10 flex items-center justify-center group-hover:shadow-glow-sm transition-shadow">
                      <Icon className="w-6 h-6 text-accent-primary" />
                    </div>
                    <div className="text-text-tertiary font-mono text-sm">+</div>
                    <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-white/5 flex items-center justify-center">
                      <AccentIcon className="w-5 h-5 text-accent-secondary" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-xl text-white mb-1">
                    {feature.title}
                  </h3>
                  <h3 className="font-display font-bold text-xl text-gradient mb-4">
                    {feature.titleHighlight}
                  </h3>

                  {/* Description */}
                  <p className="text-text-secondary text-sm leading-relaxed mb-5">
                    {feature.description}
                  </p>

                  {/* Code snippet */}
                  <div className="bg-bg-primary rounded-lg p-3 font-mono text-xs border border-white/5 mb-5">
                    {feature.codeSnippet.split('\n').map((line, i) => (
                      <div key={i} className="text-text-code">
                        {line.startsWith('//') || line.startsWith('#') ? (
                          <span className="code-comment">{line}</span>
                        ) : line.startsWith('✓') ? (
                          <span className="code-success">{line}</span>
                        ) : line.startsWith('$') || line.startsWith('>') ? (
                          <span className="code-prompt">{line}</span>
                        ) : line.includes('$') && line.includes('JARVIS') ? (
                          <>
                            <span className="text-text-secondary">{line.split(':')[0]}:</span>
                            <span className="code-accent"> {line.split(':')[1]}</span>
                          </>
                        ) : (
                          line
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {feature.stats.map((stat) => (
                      <div key={stat.label} className="bg-bg-tertiary rounded-lg p-3 text-center">
                        <div className="font-display font-bold text-lg text-accent-primary">{stat.value}</div>
                        <div className="text-xs text-text-tertiary">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* CTA link */}
                  <button className="flex items-center gap-1.5 text-sm text-accent-primary hover:text-accent-secondary transition-colors group/link">
                    Learn more
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
