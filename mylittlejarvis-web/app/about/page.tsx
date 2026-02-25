import { Metadata } from 'next'
import Link from 'next/link'
import { getConfig } from '@/lib/server-config'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig()
  return {
    title: `About - ${config.site.name}`,
    description: config.about.hero.subtitle,
  }
}

export default async function AboutPage() {
  const config = await getConfig()
  const { about } = config

  return (
    <main className="min-h-screen bg-[#0A0A0F]">
      <Header config={config} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-6">
            {about.hero.title.split('Jarvis')[0]}<span className="text-[#00D4AA]">Jarvis</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {about.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-6">
                {about.mission.title}
              </h2>
              {about.mission.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-gray-400 mb-4">
                  {paragraph}
                </p>
              ))}
              <div className="flex gap-8 mt-8">
                {about.mission.stats.map((stat, i) => (
                  <div key={i}>
                    <div className="text-3xl font-bold text-[#00D4AA]">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#00D4AA]/20 to-purple-500/20 rounded-2xl p-8 border border-white/10">
              <div className="text-[#00D4AA] text-6xl mb-4">♻️</div>
              <h3 className="text-xl font-bold text-white mb-2">Reduce E-Waste</h3>
              <p className="text-gray-400">
                Give your old phone a new purpose instead of letting it become electronic waste.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-white text-center mb-12">
            {about.team.title}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {about.team.members.map((member, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-[#00D4AA]/30 transition-colors">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00D4AA] to-purple-500 rounded-full mb-4 flex items-center justify-center text-2xl font-bold text-black">
                  {member.name[0]}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                <p className="text-[#00D4AA] text-sm mb-3">{member.role}</p>
                <p className="text-gray-400 text-sm">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-white text-center mb-12">
            {about.values.title}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {about.values.items.map((value, i) => (
              <div key={i} className="text-center p-6">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                <p className="text-gray-400 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-6">
            Join the Movement
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Be part of the community that&apos;s transforming old phones into powerful AI assistants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-[#00D4AA] text-black font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors"
            >
              Get Started Free
            </a>
            <Link
              href="/docs"
              className="px-8 py-3 bg-white/5 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors border border-white/10"
            >
              Read Documentation
            </Link>
          </div>
        </div>
      </section>

      <Footer config={config} />
    </main>
  )
}
