import { getConfig } from '@/lib/server-config'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { DocsSidebar } from '@/components/docs/DocsSidebar'

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-bg-tertiary my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-bg-tertiary">
        <span className="text-xs text-[#4A4A6A] font-mono">{language}</span>
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
      </div>
      <pre className="bg-[#0D0D15] px-4 py-4 overflow-x-auto">
        <code className="text-sm font-mono text-[#E0E0F0] leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  )
}

function Step({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4 mb-8">
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D4AA] to-[#00B4D8] flex items-center justify-center text-[#0A0A0F] font-bold text-sm">
          {number}
        </div>
        <div className="w-px flex-1 bg-bg-tertiary mt-2" />
      </div>
      <div className="pb-8 flex-1">
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <div className="text-text-secondary text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function Callout({
  type,
  children,
}: {
  type: 'info' | 'warning' | 'tip'
  children: React.ReactNode
}) {
  const styles = {
    info: { border: 'border-[#00B4D8]/40', bg: 'bg-[#00B4D8]/5', icon: 'ℹ️', label: 'Note' },
    warning: { border: 'border-[#FEBC2E]/40', bg: 'bg-[#FEBC2E]/5', icon: '⚠️', label: 'Warning' },
    tip: { border: 'border-[#00D4AA]/40', bg: 'bg-[#00D4AA]/5', icon: '💡', label: 'Tip' },
  }
  const s = styles[type]
  return (
    <div className={`rounded-lg border ${s.border} ${s.bg} px-4 py-3 my-4`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
        {s.icon} {s.label}
      </p>
      <div className="text-sm text-[#C0C0D0] leading-relaxed">{children}</div>
    </div>
  )
}

export default async function InstallPage() {
  const config = await getConfig()
  const installConfig = config.docs.pages.install as
    | { title?: string; icon?: string; content?: string }
    | undefined
  const sidebar = config.docs.sidebar

  const pageTitle = installConfig?.title ?? 'Installation Guide'

  return (
    <div className="docs-container font-[\'Space_Grotesk\',sans-serif]">
      <Header config={config} />

      {/* Layout */}
      <div className="docs-layout">
        {/* Sidebar */}
        <DocsSidebar sidebar={sidebar} currentSlug="install" />

        {/* Main content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-8 py-10 max-w-3xl w-full">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#4A4A6A] mb-6">
            <Link href="/docs" className="hover:text-accent-primary transition-colors">Docs</Link>
            <span>/</span>
            <span className="text-text-secondary">Installation</span>
          </nav>

          {/* Page header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-accent-primary text-xs font-medium mb-4">
              ⚙️ Getting Started
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{pageTitle}</h1>
            <p className="text-text-secondary text-base leading-relaxed">
              This guide walks you through installing MyLittleJarvis on your old Android phone and
              connecting it to Claude AI. The entire process takes under 5 minutes.
            </p>
          </div>

          {/* Prerequisites */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
              Prerequisites
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: '📱', label: 'Android 8.0+', desc: 'Oreo or later' },
                { icon: '🧠', label: '3 GB RAM', desc: 'Minimum recommended' },
                { icon: '💾', label: '4 GB Storage', desc: 'Free space required' },
                { icon: '🔑', label: 'Anthropic API Key', desc: 'Claude access required' },
                { icon: '🌐', label: 'Node.js 18+', desc: 'On your host machine' },
                { icon: '📦', label: 'npm or bun', desc: 'Package manager' },
              ].map((req) => (
                <div
                  key={req.label}
                  className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary border border-bg-tertiary"
                >
                  <span className="text-xl">{req.icon}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{req.label}</p>
                    <p className="text-[#4A4A6A] text-xs">{req.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Installation Steps */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-bg-tertiary">
              Installation Steps
            </h2>

            <Step number={1} title="Clone the Repository">
              <p className="mb-2">Download the JARVIS agent source code to your machine.</p>
              <CodeBlock code="git clone https://github.com/mylittlejarvis/jarvis-agent.git\ncd jarvis-agent" />
            </Step>

            <Step number={2} title="Install Dependencies">
              <p className="mb-2">
                Install all required Node.js packages. We recommend using{' '}
                <code className="text-accent-primary bg-[#00D4AA]/10 px-1 rounded">bun</code> for
                faster installs, but npm works too.
              </p>
              <CodeBlock code="# Using bun (recommended)\nbun install\n\n# Or npm\nnpm install" />
            </Step>

            <Step number={3} title="Configure Environment Variables">
              <p className="mb-2">
                Copy the example env file and add your Anthropic API key.
              </p>
              <CodeBlock code="cp .env.example .env" />
              <p className="mt-2 mb-2">
                Open <code className="text-accent-primary bg-[#00D4AA]/10 px-1 rounded">.env</code> in
                your editor and fill in the required values:
              </p>
              <CodeBlock
                language=".env"
                code={`ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx\nJARVIS_PORT=3000\nJARVIS_PERSONA=default\nLOG_LEVEL=info`}
              />
              <Callout type="warning">
                Never commit your <strong>.env</strong> file to version control. It is already
                listed in <code>.gitignore</code>.
              </Callout>
            </Step>

            <Step number={4} title="Run the Setup Script">
              <p className="mb-2">
                The setup script initialises your database, generates QR codes, and verifies
                connectivity.
              </p>
              <CodeBlock code="./setup.sh" />
              <Callout type="tip">
                If you see a permission error, make the script executable first:{' '}
                <code className="text-accent-primary">chmod +x setup.sh</code>
              </Callout>
            </Step>

            <Step number={5} title="Connect Your Phone">
              <p className="mb-2">
                Open the JARVIS app on your Android device and scan the QR code displayed in
                your terminal.
              </p>
              <CodeBlock code="# Start the server and display QR code\nbun run dev" />
              <Callout type="info">
                Keep your phone and computer on the same Wi-Fi network during pairing.
              </Callout>
            </Step>

            <Step number={6} title="Choose Your Persona &amp; Start">
              <p className="mb-2">
                Select an AI persona from the on-device UI, or set a default in{' '}
                <code className="text-accent-primary bg-[#00D4AA]/10 px-1 rounded">.env</code>.
              </p>
              <CodeBlock
                language="bash"
                code="# List available personas\nbun run personas:list\n\n# Set default persona\nbun run personas:set --name jarvis"
              />
            </Step>
          </section>

          {/* Troubleshooting */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
              Troubleshooting
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: 'QR code not appearing',
                  a: 'Make sure port 3000 is not blocked by a firewall. Try running with JARVIS_PORT=3001 in your .env file.',
                  cmd: 'JARVIS_PORT=3001 bun run dev',
                },
                {
                  q: 'API key rejected (401 error)',
                  a: 'Double-check your ANTHROPIC_API_KEY in .env. Keys start with sk-ant-. Regenerate at console.anthropic.com if needed.',
                  cmd: null,
                },
                {
                  q: 'Phone cannot connect to server',
                  a: 'Ensure both devices are on the same network. Check your host machine IP and update JARVIS_HOST in .env.',
                  cmd: '# Find your local IP\nip route get 1 | awk \'{print $7}\'',
                },
                {
                  q: 'setup.sh fails with "EACCES"',
                  a: 'Node may not have write permissions. Try running setup.sh in a directory you own, or prefix with sudo.',
                  cmd: 'sudo ./setup.sh',
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="group rounded-lg border border-bg-tertiary bg-bg-secondary overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm text-white font-medium select-none list-none">
                    <span>🔍 {item.q}</span>
                    <span className="text-[#4A4A6A] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-4 pb-4 pt-1">
                    <p className="text-text-secondary text-sm mb-2">{item.a}</p>
                    {item.cmd && <CodeBlock code={item.cmd} />}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Next steps */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
              Next Steps
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { href: '/docs/quickstart', icon: '🚀', title: 'Quick Start', desc: 'Start chatting in 3 minutes' },
                { href: '/docs/architecture', icon: '🏗️', title: 'Architecture', desc: 'How JARVIS works under the hood' },
                { href: '/docs/api', icon: '📖', title: 'API Reference', desc: 'Explore all endpoints' },
                { href: '/docs/troubleshooting', icon: '🔍', title: 'Troubleshooting', desc: 'Deeper debugging guide' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-4 rounded-lg bg-bg-secondary border border-bg-tertiary hover:border-[#00D4AA]/40 hover:bg-[#00D4AA]/5 transition-all group"
                >
                  <span className="text-2xl">{link.icon}</span>
                  <div>
                    <p className="text-white text-sm font-medium group-hover:text-accent-primary transition-colors">
                      {link.title}
                    </p>
                    <p className="text-[#4A4A6A] text-xs">{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </main>
      </div>
      <Footer config={config} />
    </div>
  )
}
