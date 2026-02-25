import { Metadata } from 'next'
import { getConfig } from '@/lib/server-config'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { DocsSidebar } from '@/components/docs/DocsSidebar'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Chat Interface - MyLittleJarvis',
    description: 'Learn how to use the JARVIS chat interface, slash commands, and tips for effective conversations.',
  }
}

export default async function ChatPage() {
  const config = await getConfig()
  const sidebar = config.docs.sidebar

  return (
    <div className="docs-container">
      <Header config={config} />

      <div className="docs-layout">
        <DocsSidebar sidebar={sidebar} currentSlug="chat" />

        <main className="docs-main">
          <h1 className="text-4xl font-bold text-white mb-6">💬 Chat Interface</h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-400 text-lg mb-8">
              The JARVIS chat interface provides a powerful terminal-based conversation experience. 
              Start chatting with natural language and let your AI assistant handle the rest.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Starting a Chat</h2>
            <p className="text-gray-400 mb-4">
              Simply type <code className="bg-gray-800 px-2 py-1 rounded">jarvis</code> in your terminal to start an interactive session.
            </p>
            <pre className="bg-gray-900 p-4 rounded-lg mb-6">
              <code className="text-accent-primary">$ jarvis</code>
              <br />
              <code className="text-gray-400">🤖 JARVIS: Hello! How can I help you today?</code>
              <br />
              <code className="text-white">&gt; </code>
            </pre>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Slash Commands</h2>
            <p className="text-gray-400 mb-4">Type these commands during chat:</p>
            <ul className="space-y-2 text-gray-400">
              <li><code>/help</code> - Show available commands</li>
              <li><code>/reset</code> - Clear conversation history</li>
              <li><code>/persona [name]</code> - Switch AI persona</li>
              <li><code>/model [name]</code> - Switch AI model</li>
              <li><code>/exit</code> - Quit chat</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Tips & Tricks</h2>
            <ul className="space-y-2 text-gray-400">
              <li>Use arrow keys (↑/↓) to navigate through chat history</li>
              <li>Press Ctrl+C to exit gracefully</li>
              <li>Multi-line inputs are supported (press Enter twice to send)</li>
              <li>Code blocks are automatically formatted</li>
            </ul>
          </div>
        </main>
      </div>

      <Footer config={config} />
    </div>
  )
}
