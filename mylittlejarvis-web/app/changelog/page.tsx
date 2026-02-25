import { Metadata } from 'next'
import { getConfig } from '@/lib/server-config'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig()
  return {
    title: config.changelog.meta.title,
    description: config.changelog.meta.description,
  }
}

const typeConfig = {
  new: { label: 'New', color: 'bg-[#00D4AA]/10 text-[#00D4AA] border-[#00D4AA]/20' },
  improved: { label: 'Improved', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  fixed: { label: 'Fixed', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
}

export default async function ChangelogPage() {
  const config = await getConfig()
  const { hero, releases } = config.changelog

  return (
    <main className="min-h-screen bg-[#0A0A0F]">
      <Header config={config} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/30 text-[#00D4AA] text-sm mb-6">
            <span>{hero.badge}</span> {hero.badgeText}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-6">
            {hero.title} <span className="text-[#00D4AA]">{hero.titleHighlight}</span>
          </h1>
          <p className="text-xl text-gray-400">
            {hero.subtitle}{' '}
            <a href="#" className="text-[#00D4AA] hover:underline">{hero.feedLinkText}</a> {hero.subtitleSuffix}
          </p>
        </div>
      </section>

      {/* Changelog Timeline */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-12">
            {releases.map((release, idx) => (
              <div key={release.version} className="relative">
                {/* Timeline connector */}
                {idx < releases.length - 1 && (
                  <div className="absolute left-5 top-12 bottom-0 w-px bg-gradient-to-b from-[#00D4AA]/30 to-transparent" />
                )}

                <div className="flex gap-6">
                  {/* Dot */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0A0A0F] border-2 border-[#00D4AA]/50 flex items-center justify-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-[#00D4AA]" />
                  </div>

                  <div className="flex-1 pb-4">
                    {/* Version header */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white">
                        {release.version}
                      </h2>
                      {release.tag && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${release.tagColor}`}>
                          {release.tag}
                        </span>
                      )}
                      <span className="text-gray-500 text-sm ml-auto">{release.date}</span>
                    </div>

                    {/* Changes */}
                    <div className="bg-[#12121A] rounded-xl border border-white/10 overflow-hidden">
                      <ul className="divide-y divide-white/5">
                        {release.changes.map((change, i) => {
                          const tc = typeConfig[change.type as keyof typeof typeConfig]
                          return (
                            <li key={i} className="flex items-start gap-3 px-5 py-3">
                              <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold border mt-0.5 ${tc.color}`}>
                                {tc.label}
                              </span>
                              <span className="text-gray-300 text-sm leading-relaxed">{change.text}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer config={config} />
    </main>
  )
}
