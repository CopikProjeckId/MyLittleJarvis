import { Metadata } from 'next'
import Link from 'next/link'
import { getConfig } from '@/lib/server-config'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig()
  return {
    title: `FAQ - ${config.site.name}`,
    description: config.faq.hero.subtitle,
  }
}

export default async function FAQPage() {
  const config = await getConfig()

  return (
    <main className="min-h-screen bg-[#0A0A0F]">
      <Header config={config} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-6">
            {config.faq.hero.title.split(' ').slice(0, -1).join(' ')} <span className="text-[#00D4AA]">{config.faq.hero.title.split(' ').slice(-1)[0]}</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {config.faq.hero.subtitle}
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {config.faq.questions.map((faq, index) => (
              <details
                key={index}
                className="group bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors">
                  <h3 className="text-lg font-semibold text-white pr-4">
                    {faq.question}
                  </h3>
                  <span className="text-[#00D4AA] text-2xl transition-transform group-open:rotate-180">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-400 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-4">
            {config.faq.cta.title}
          </h2>
          <p className="text-gray-400 mb-8">
            {config.faq.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/docs"
              className="px-8 py-3 bg-[#00D4AA] text-black font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors"
            >
              {config.faq.cta.primary}
            </Link>
            <a
              href="#"
              className="px-8 py-3 bg-white/5 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors border border-white/10"
            >
              {config.faq.cta.secondary}
            </a>
          </div>
        </div>
      </section>

      <Footer config={config} />
    </main>
  )
}
