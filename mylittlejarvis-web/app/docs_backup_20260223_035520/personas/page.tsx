import { getConfig } from '@/lib/server-config'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export const metadata: Metadata = {
  title: 'Personas - MyLittleJarvis Docs',
  description: 'Switch between different AI personalities to match your workflow and mood.',
}

const personas = [
  {
    id: 'jarvis',
    name: 'JARVIS',
    icon: '🤖',
    tag: 'Default',
    tagColor: '#00D4AA',
    description: 'The classic AI assistant. Efficient, precise, and professional — inspired by Tony Stark\'s iconic companion.',
    traits: ['Concise responses', 'Task-focused', 'Professional tone', 'Technical expertise'],
    command: '/persona jarvis',
  },
  {
    id: 'mentor',
    name: 'Mentor',
    icon: '🎓',
    tag: 'Learning',
    tagColor: '#00B4D8',
    description: 'Patient, thorough, and educational. Explains concepts step-by-step with examples and analogies.',
    traits: ['Detailed explanations', 'Socratic method', 'Encourages questions', 'Beginner-friendly'],
    command: '/persona mentor',
  },
  {
    id: 'coder',
    name: 'Code Wizard',
    icon: '💻',
    tag: 'Dev',
    tagColor: '#7C3AED',
    description: 'Laser-focused on engineering. Reviews code, suggests optimizations, and writes clean implementations.',
    traits: ['Code-first responses', 'Best practices', 'Security-aware', 'Opinionated reviews'],
    command: '/persona coder',
  },
  {
    id: 'creative',
    name: 'Muse',
    icon: '✨',
    tag: 'Creative',
    tagColor: '#F59E0B',
    description: 'Imaginative and free-flowing. Ideal for brainstorming, writing, and thinking outside the box.',
    traits: ['Open-ended ideation', 'Narrative style', 'Lateral thinking', 'Playful tone'],
    command: '/persona muse',
  },
  {
    id: 'analyst',
    name: 'Analyst',
    icon: '📊',
    tag: 'Research',
    tagColor: '#EF4444',
    description: 'Data-driven and structured. Breaks down complex problems into frameworks, pros/cons, and summaries.',
    traits: ['Structured output', 'Evidence-based', 'Comparative analysis', 'Executive summaries'],
    command: '/persona analyst',
  },
  {
    id: 'companion',
    name: 'Companion',
    icon: '🌟',
    tag: 'Personal',
    tagColor: '#EC4899',
    description: 'Warm, empathetic, and conversational. Great for journaling, reflection, and everyday assistance.',
    traits: ['Active listening', 'Empathetic tone', 'Non-judgmental', 'Casual language'],
    command: '/persona companion',
  },
]

const usageSections = [
  {
    id: 'switching',
    title: 'Switching Personas',
    icon: '🔄',
    content: [
      'Use the /persona command followed by the persona name in any chat.',
      'Persona switches take effect immediately on your next message.',
      'Your conversation history is preserved when switching personas.',
      'Type /persona list to see all available personas at any time.',
    ],
    type: 'list' as const,
  },
  {
    id: 'custom',
    title: 'Custom Personas',
    icon: '🛠️',
    content: [
      'Define your own personas in config/personas.json in the agent directory.',
      'Each persona can have a custom system prompt, tone, and response style.',
      'Custom personas are available immediately after saving the config file.',
      'Share your personas with the community on our Discord or GitHub Discussions.',
    ],
    type: 'list' as const,
  },
  {
    id: 'tips',
    title: 'Tips & Best Practices',
    icon: '💡',
    content: [
      'Match your persona to your task — use Code Wizard for debugging, Mentor for learning.',
      'Muse works best for open-ended prompts without strict requirements.',
      'Analyst is ideal before making important decisions — ask it to compare options.',
      'Companion mode can help with mental clarity through structured journaling prompts.',
    ],
    type: 'list' as const,
  },
]

export default async function PersonasPage() {
  const config = await getConfig()
  const page = config.docs.pages.personas as {
    title?: string
    icon?: string
    content?: string
  } | undefined
  const sidebar = config.docs.sidebar

  const pageTitle = page?.title ?? 'Personas'
  const pageIcon = page?.icon ?? '🎭'

  return (
    <div className="docs-container font-['Space_Grotesk',sans-serif]">
      <Header config={config} />

      {/* Layout */}
      <div className="docs-layout">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 fixed h-[calc(100vh-72px)] overflow-y-auto border-r border-bg-tertiary py-8 px-4">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            {sidebar.title}
          </p>
          {sidebar.sections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="text-[#606070] text-xs uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const href = item.slug ? `/docs/${item.slug}` : '/docs'
                  const isActive = item.slug === 'personas'
                  return (
                    <li key={item.slug}>
                      <Link
                        href={href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-[#00D4AA]/10 text-accent-primary'
                            : 'text-text-secondary hover:text-white hover:bg-bg-tertiary'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-8 py-10 max-w-3xl w-full">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[#606070] mb-8">
            <Link href="/docs" className="hover:text-accent-primary transition-colors">Docs</Link>
            <span>/</span>
            <span className="text-text-secondary">Getting Started</span>
            <span>/</span>
            <span className="text-white">{pageTitle}</span>
          </nav>

          {/* Page title */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{pageIcon}</span>
              <h1 className="text-3xl font-bold text-white tracking-tight">{pageTitle}</h1>
            </div>
            <p className="text-text-secondary text-lg leading-relaxed">
              {page?.content ?? 'Switch between different AI personalities to match your workflow and mood.'}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#00D4AA]/10 text-accent-primary border border-[#00D4AA]/20 rounded-full px-3 py-1">
                🎭 {personas.length} built-in personas
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-secondary border border-[#2A2A34] rounded-full px-3 py-1">
                🛠️ Fully customizable
              </span>
            </div>
          </div>

          {/* Persona cards */}
          <section id="personas" className="mb-12">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-6 pb-2 border-b border-bg-tertiary">
              <span>🎭</span>
              <span>Available Personas</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {personas.map((persona) => (
                <div
                  key={persona.id}
                  className="group rounded-xl border border-bg-tertiary bg-[#0D0D15] p-5 hover:border-[#00D4AA]/30 hover:bg-[#00D4AA]/5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{persona.icon}</span>
                      <span className="font-semibold text-white">{persona.name}</span>
                    </div>
                    <span
                      className="text-xs font-medium rounded-full px-2.5 py-0.5 border"
                      style={{
                        color: persona.tagColor,
                        borderColor: `${persona.tagColor}33`,
                        backgroundColor: `${persona.tagColor}14`,
                      }}
                    >
                      {persona.tag}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4">{persona.description}</p>
                  <ul className="space-y-1 mb-4">
                    {persona.traits.map((trait) => (
                      <li key={trait} className="flex items-center gap-2 text-xs text-[#C0C0D0]">
                        <span className="w-1 h-1 rounded-full bg-[#00D4AA] flex-shrink-0" />
                        {trait}
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-lg bg-[#111118] border border-bg-tertiary px-3 py-2">
                    <code className="text-xs text-accent-primary font-mono">{persona.command}</code>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Usage sections */}
          <div className="space-y-10">
            {usageSections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </h2>
                <ul className="space-y-2">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[#C0C0D0]">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#00D4AA] flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Next / Prev navigation */}
          <div className="mt-14 pt-8 border-t border-bg-tertiary grid grid-cols-2 gap-4">
            <Link
              href="/docs/requirements"
              className="group flex flex-col p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">← Previous</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                📋 Requirements
              </span>
            </Link>
            <Link
              href="/docs"
              className="group flex flex-col items-end p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">Back to →</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                🏠 Introduction
              </span>
            </Link>
          </div>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-[#606070]">
            Want to contribute a persona?{' '}
            <a
              href="https://github.com/mylittlejarvis/jarvis-agent/discussions"
              target="_blank"
              rel="noreferrer"
              className="text-accent-primary hover:underline"
            >
              Share it on GitHub Discussions
            </a>{' '}
            or join our{' '}
            <a href="#" className="text-accent-primary hover:underline">
              Discord community
            </a>
            .
          </p>
        </main>
      </div>
      <Footer config={config} />
    </div>
  )
}
