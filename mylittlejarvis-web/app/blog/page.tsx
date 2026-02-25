import { Metadata } from 'next'
import Link from 'next/link'
import { getConfig } from '@/lib/server-config'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig()
  return {
    title: config.blog.meta.title,
    description: config.blog.meta.description,
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Release':
      return 'bg-[#00D4AA]/20 text-[#00D4AA]'
    case 'Tutorial':
      return 'bg-blue-500/20 text-blue-400'
    case 'Guide':
      return 'bg-purple-500/20 text-purple-400'
    case 'Technical':
      return 'bg-orange-500/20 text-orange-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

export default async function BlogPage() {
  const config = await getConfig()
  const featuredPost = config.blog.posts.find(p => p.featured)
  const regularPosts = config.blog.posts.filter(p => !p.featured)

  return (
    <main className="min-h-screen bg-[#0A0A0F]">
      <Header config={config} activePage="blog" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-6">
            <span className="text-[#00D4AA]">{config.blog.hero.title}</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {config.blog.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-[#00D4AA]/10 to-purple-500/10 rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid md:grid-cols-2 gap-8 p-8">
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(featuredPost.category)}`}>
                      {featuredPost.category}
                    </span>
                    <span className="text-sm text-gray-500">{featuredPost.date}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-4">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{featuredPost.readTime}</span>
                    <button className="text-[#00D4AA] font-semibold hover:underline">
                      Read More →
                    </button>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#00D4AA]/20 to-purple-500/20 rounded-xl flex items-center justify-center min-h-[200px]">
                  <div className="text-6xl">🚀</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white">
              All Posts
            </h2>
            <div className="flex gap-2">
              {['All', 'Release', 'Tutorial', 'Guide', 'Technical'].map((cat) => (
                <button
                  key={cat}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    cat === 'All'
                      ? 'bg-[#00D4AA] text-black'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post, index) => (
              <article
                key={index}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-[#00D4AA]/30 transition-colors group"
              >
                <div className="h-48 bg-gradient-to-br from-[#00D4AA]/10 to-purple-500/10 flex items-center justify-center">
                  <div className="text-4xl group-hover:scale-110 transition-transform">
                    {post.category === 'Tutorial' ? '📚' :
                     post.category === 'Guide' ? '📖' :
                     post.category === 'Technical' ? '⚙️' : '📝'}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(post.category)}`}>
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{post.date}</span>
                    <span className="text-gray-500">{post.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-white mb-4">
            {config.blog.newsletter.title}
          </h2>
          <p className="text-gray-400 mb-8">
            {config.blog.newsletter.subtitle}
          </p>
          <form className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder={config.blog.newsletter.placeholder}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4AA]"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#00D4AA] text-black font-semibold rounded-lg hover:bg-[#00D4AA]/90 transition-colors"
            >
              {config.blog.newsletter.button}
            </button>
          </form>
        </div>
      </section>

      <Footer config={config} />
    </main>
  )
}
