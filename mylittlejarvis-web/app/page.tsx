import { Metadata } from 'next'
import Link from 'next/link'
import { getConfig } from '@/lib/server-config'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { HeroClient } from '@/components/HeroClient'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig()
  return {
    title: config.site.tagline,
    description: config.site.description,
  }
}

export default async function Home() {
  const config = await getConfig()
  const { home } = config

  return (
    <main className="relative min-h-screen bg-[#0A0A0F]">
      <Header config={config} />

      {/* Hero Section - Client Component with i18n */}
      <HeroClient />

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {home.features.title}
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              {home.features.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {home.features.cards.map((card, index) => (
              <div
                key={index}
                className="group bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#00D4AA]/50 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {card.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terminal Section */}
      <section id="terminal" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {home.terminal.title}
            </h2>
            <p className="text-lg text-gray-400">
              {home.terminal.subtitle}
            </p>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="bg-[#252525] px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-4 text-sm text-gray-500 font-mono">terminal — zsh</span>
            </div>

            <div className="p-6 font-mono text-sm md:text-base">
              {home.terminal.steps.map((step, index) => (
                <div key={index} className="mb-2">
                  <span className="text-[#00D4AA]">➜</span>{' '}
                  <span className="text-gray-300">{step}</span>
                </div>
              ))}
              <div className="mt-4">
                <span className="text-[#00D4AA]">➜</span>{' '}
                <span className="animate-pulse text-gray-500">_</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              💡 Requires Node.js 18+ and Git. See{' '}
              <Link href="/docs" className="text-[#00D4AA] hover:underline">
                documentation
              </Link>{' '}
              for detailed setup.
            </p>
          </div>
        </div>
      </section>

      {/* Installation Section */}
      <section id="installation" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {home.installation.title}
            </h2>
            <p className="text-lg text-gray-400">
              Follow these steps to deploy your personal JARVIS
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-4 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#00D4AA] via-purple-500 to-transparent" />

            <div className="space-y-8 md:space-y-12">
              {home.installation.steps.map((step, index) => (
                <div key={index} className="relative flex gap-6 md:gap-8">
                  <div className="relative z-10 flex-shrink-0 w-8 h-8 md:w-16 md:h-16 bg-[#0A0A0F] border-2 border-[#00D4AA] rounded-full flex items-center justify-center">
                    <span className="text-[#00D4AA] font-bold text-xs md:text-sm">{step.number}</span>
                  </div>

                  <div className="flex-1 pt-1 md:pt-4">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-sm md:text-base">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 text-center">
            <a
              href="https://github.com/mylittlejarvis/jarvis-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#00D4AA] text-black font-bold rounded-xl hover:bg-[#00D4AA]/90 transition-all text-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.387-1.11-1.756-1.11-1.756-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.311.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 12 0z" />
              </svg>
              Start Installation on GitHub
            </a>
          </div>
        </div>
      </section>

      <Footer config={config} />
    </main>
  )
}
