import { getConfig } from '@/lib/server-config'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export const metadata: Metadata = {
  title: 'Troubleshooting - MyLittleJarvis Docs',
  description: 'Solutions to common issues and errors with MyLittleJarvis.',
}

const issues = [
  {
    id: 'phone-not-connecting',
    category: 'Connection',
    icon: '📡',
    title: 'Phone not connecting to agent',
    symptom: 'The phone shows "Connecting…" but never establishes a session.',
    causes: [
      'Phone and computer are on different network segments or VLANs.',
      'Firewall is blocking the WebSocket port (default 3001).',
      'The QR code expired — it is valid for 60 seconds only.',
    ],
    fix: [
      'Ensure both devices share the same Wi-Fi network.',
      'Allow port 3001 through your firewall: sudo ufw allow 3001',
      'Restart the agent and scan the freshly generated QR code.',
    ],
    code: 'sudo ufw allow 3001\nnpm run dev',
  },
  {
    id: 'api-key-error',
    category: 'API',
    icon: '🔑',
    title: 'ANTHROPIC_API_KEY invalid or missing',
    symptom: 'Agent starts but immediately throws AuthenticationError.',
    causes: [
      '.env file not copied from .env.example.',
      'Key has trailing whitespace or newline characters.',
      'Key was revoked or has insufficient quota.',
    ],
    fix: [
      'Verify the key in your .env file has no extra spaces.',
      'Test the key directly: curl https://api.anthropic.com/v1/messages with your key.',
      'Generate a new key at console.anthropic.com if needed.',
    ],
    code: 'cat .env | grep ANTHROPIC_API_KEY\n# Should output: ANTHROPIC_API_KEY=sk-ant-...',
  },
  {
    id: 'low-ram',
    category: 'Performance',
    icon: '💾',
    title: 'Phone overheating or crashing',
    symptom: 'The agent process is killed by the OS, or the phone becomes unresponsive.',
    causes: [
      'Device has less than 3 GB RAM (minimum requirement).',
      'Too many background apps consuming memory.',
      'Thermal throttling on older devices.',
    ],
    fix: [
      'Close all background apps before starting the agent.',
      'Enable Low Power Mode in agent settings: set AGENT_LOW_POWER=true in .env.',
      'Keep the phone plugged in and in a well-ventilated area.',
    ],
    code: '# .env\nAGENT_LOW_POWER=true\nAGENT_MAX_CONCURRENT_TASKS=1',
  },
  {
    id: 'telegram-bot-silent',
    category: 'Integrations',
    icon: '📨',
    title: 'Telegram bot not responding',
    symptom: 'Messages sent to the bot receive no reply.',
    causes: [
      'TELEGRAM_BOT_TOKEN missing or incorrect.',
      'Bot was not started with /start command after creation.',
      'Webhook URL unreachable from the internet (using localhost).',
    ],
    fix: [
      'Double-check TELEGRAM_BOT_TOKEN in .env.',
      'Send /start to your bot in Telegram to initialize the session.',
      'Use a tunnel like ngrok for local development: ngrok http 3001.',
    ],
    code: 'npx ngrok http 3001\n# Copy the https URL and set WEBHOOK_URL in .env',
  },
  {
    id: 'node-version',
    category: 'Setup',
    icon: '🟢',
    title: 'Dependency install fails',
    symptom: 'npm install errors with engine incompatibility or syntax errors.',
    causes: [
      'Node.js version below 18.0.',
      'Corrupted node_modules from a partial install.',
      'npm cache conflict.',
    ],
    fix: [
      'Check your Node version: node --version (must be ≥ 18).',
      'Install the correct version via nvm: nvm install 18 && nvm use 18.',
      'Clear the cache and reinstall: rm -rf node_modules && npm install.',
    ],
    code: 'node --version\nnvm install 18 && nvm use 18\nrm -rf node_modules && npm install',
  },
  {
    id: 'persona-not-loading',
    category: 'Personas',
    icon: '🎭',
    title: 'Custom persona not loading',
    symptom: '/persona switch returns "Persona not found".',
    causes: [
      'Persona file name does not match the slug used in the command.',
      'YAML syntax error inside the persona file.',
      'Personas directory path not set in config.',
    ],
    fix: [
      'List available personas: /persona list.',
      'Validate your YAML file at yaml.org/start.html.',
      'Ensure PERSONAS_DIR in .env points to the correct folder.',
    ],
    code: '# .env\nPERSONAS_DIR=./personas\n\n# Check file names match your /persona switch argument',
  },
]

const categories = Array.from(new Set(issues.map((i) => i.category)))

export default async function TroubleshootingPage() {
  const config = await getConfig()
  const page = (config.docs.pages as Record<string, { title?: string; icon?: string; content?: string }>)
    .troubleshooting
  const sidebar = config.docs.sidebar

  const pageTitle = page?.title ?? 'Troubleshooting'
  const pageIcon = page?.icon ?? '🔧'

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
                  const isActive = item.slug === 'troubleshooting'
                  return (
                    <li key={item.slug ?? 'index'}>
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
            <span className="text-text-secondary">Support</span>
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
              Solutions to the most common issues. Find your symptom, follow the fix.
            </p>
            {/* Category filter pills */}
            <div className="flex flex-wrap items-center gap-2 mt-5">
              {categories.map((cat) => (
                <a
                  key={cat}
                  href={`#${issues.find((i) => i.category === cat)?.id}`}
                  className="inline-flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-secondary border border-[#2A2A34] rounded-full px-3 py-1 hover:border-[#00D4AA]/40 hover:text-accent-primary transition-colors"
                >
                  {issues.find((i) => i.category === cat)?.icon} {cat}
                </a>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div className="space-y-8">
            {issues.map((issue) => (
              <section
                key={issue.id}
                id={issue.id}
                className="rounded-2xl border border-bg-tertiary bg-[#0D0D15] overflow-hidden"
              >
                {/* Issue header */}
                <div className="flex items-start gap-3 px-6 py-5 border-b border-bg-tertiary bg-[#111118]">
                  <span className="text-2xl mt-0.5">{issue.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-accent-primary bg-[#00D4AA]/10 border border-[#00D4AA]/20 rounded-full px-2 py-0.5">
                        {issue.category}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-white">{issue.title}</h2>
                    <p className="text-sm text-text-secondary mt-1">{issue.symptom}</p>
                  </div>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Causes */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#606070] mb-2">
                      Possible Causes
                    </h3>
                    <ul className="space-y-1.5">
                      {issue.causes.map((cause, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-[#C0C0D0]">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF6B6B] flex-shrink-0" />
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Fix */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#606070] mb-2">
                      How to Fix
                    </h3>
                    <ul className="space-y-1.5">
                      {issue.fix.map((step, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-[#C0C0D0]">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00D4AA] flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Code */}
                  <div className="relative rounded-xl overflow-hidden border border-bg-tertiary">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-bg-tertiary bg-bg-primary">
                      <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                      <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                      <span className="w-3 h-3 rounded-full bg-[#28C840]" />
                      <span className="ml-2 text-xs text-[#606070]">bash</span>
                    </div>
                    <pre className="px-5 py-4 overflow-x-auto text-sm leading-relaxed bg-[#0D0D15]">
                      <code className="text-accent-primary font-mono">{issue.code}</code>
                    </pre>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* Still stuck? CTA */}
          <div className="mt-12 rounded-2xl border border-[#00D4AA]/20 bg-[#00D4AA]/5 px-6 py-8 text-center">
            <p className="text-2xl mb-2">🆘</p>
            <h3 className="text-lg font-semibold text-white mb-2">Still stuck?</h3>
            <p className="text-text-secondary text-sm mb-5">
              If none of these solutions helped, open a GitHub issue with your logs or ask in Discord.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a
                href="https://github.com/mylittlejarvis/jarvis-agent/issues/new"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#00D4AA] text-[#0A0A0F] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#00BF99] transition-colors"
              >
                Open GitHub Issue
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 bg-bg-tertiary text-white border border-[#2A2A34] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#222230] transition-colors"
              >
                Join Discord
              </a>
            </div>
          </div>

          {/* Prev / Next navigation */}
          <div className="mt-14 pt-8 border-t border-bg-tertiary grid grid-cols-2 gap-4">
            <Link
              href="/docs/architecture"
              className="group flex flex-col p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">← Previous</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                🏗️ Architecture
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
        </main>
      </div>
      <Footer config={config} />
    </div>
  )
}
