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

export default async function TelegramPage() {
  const config = await getConfig()
  const telegramConfig = config.docs.pages.telegram as
    | { title?: string; icon?: string; content?: string }
    | undefined
  const sidebar = config.docs.sidebar

  const pageTitle = telegramConfig?.title ?? 'Telegram Bot Integration'

  return (
    <div className="docs-container font-['Space_Grotesk',sans-serif]">
      <Header config={config} />

      {/* Layout */}
      <div className="docs-layout">
        {/* Sidebar */}
        <DocsSidebar sidebar={sidebar} currentSlug="telegram" />

        {/* Main content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-8 py-10 max-w-3xl w-full">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#4A4A6A] mb-6">
            <Link href="/docs" className="hover:text-accent-primary transition-colors">Docs</Link>
            <span>/</span>
            <span className="text-[#4A4A6A]">Integrations</span>
            <span>/</span>
            <span className="text-text-secondary">Telegram</span>
          </nav>

          {/* Page header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-accent-primary text-xs font-medium mb-4">
              ✈️ Integrations
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{pageTitle}</h1>
            <p className="text-text-secondary text-base leading-relaxed">
              Connect JARVIS to Telegram and chat with your AI assistant from any device.
              Messages are routed through your Android phone and processed by Claude in real time.
            </p>
          </div>

          {/* How it works */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
              How It Works
            </h2>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              {[
                { icon: '📱', title: 'You send a message', desc: 'Via Telegram on any device' },
                { icon: '🤖', title: 'JARVIS receives it', desc: 'Running on your Android phone' },
                { icon: '🧠', title: 'Claude responds', desc: 'Streamed back to Telegram' },
              ].map((step) => (
                <div
                  key={step.title}
                  className="flex flex-col items-center text-center p-4 rounded-lg bg-bg-secondary border border-bg-tertiary"
                >
                  <span className="text-2xl mb-2">{step.icon}</span>
                  <p className="text-white text-sm font-medium mb-1">{step.title}</p>
                  <p className="text-[#4A4A6A] text-xs">{step.desc}</p>
                </div>
              ))}
            </div>
            <Callout type="info">
              The Telegram bot runs entirely on your own infrastructure — no third-party servers
              see your conversation content beyond Telegram&apos;s own platform.
            </Callout>
          </section>

          {/* Setup Steps */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-bg-tertiary">
              Setup Steps
            </h2>

            <Step number={1} title="Create a Telegram Bot via BotFather">
              <p className="mb-2">
                Open Telegram and start a chat with{' '}
                <code className="text-accent-primary bg-[#00D4AA]/10 px-1 rounded">@BotFather</code>.
                Send the command below, follow the prompts, and copy your bot token.
              </p>
              <CodeBlock code="/newbot" language="telegram" />
              <p className="mt-2">
                BotFather will return a token like{' '}
                <code className="text-accent-primary bg-[#00D4AA]/10 px-1 rounded">
                  123456789:ABCDefGhIjKlMnOpQrStUvWxYz
                </code>
                . Keep it safe — you will need it in the next step.
              </p>
            </Step>

            <Step number={2} title="Add the Token to Your Environment">
              <p className="mb-2">
                Open your{' '}
                <code className="text-accent-primary bg-[#00D4AA]/10 px-1 rounded">.env</code> file and
                add the following variables:
              </p>
              <CodeBlock
                language=".env"
                code={`TELEGRAM_BOT_TOKEN=123456789:ABCDefGhIjKlMnOpQrStUvWxYz
TELEGRAM_ALLOWED_USERS=your_telegram_user_id
TELEGRAM_WEBHOOK_SECRET=your_random_secret_here`}
              />
              <Callout type="warning">
                Set <strong>TELEGRAM_ALLOWED_USERS</strong> to your Telegram user ID to prevent
                strangers from accessing your JARVIS instance. Find your ID by messaging{' '}
                <code className="text-accent-primary">@userinfobot</code> on Telegram.
              </Callout>
            </Step>

            <Step number={3} title="Enable the Telegram Integration">
              <p className="mb-2">
                In your JARVIS config file, enable the Telegram adapter:
              </p>
              <CodeBlock
                language="jarvis.config.ts"
                code={`export default {
  adapters: {
    telegram: {
      enabled: true,
      streamReplies: true,
      maxMessageLength: 4096,
    },
  },
}`}
              />
            </Step>

            <Step number={4} title="Register the Webhook">
              <p className="mb-2">
                Run the built-in webhook registration command. JARVIS will automatically configure
                Telegram to forward messages to your server.
              </p>
              <CodeBlock code="bun run telegram:register-webhook" />
              <Callout type="tip">
                For local development, use{' '}
                <code className="text-accent-primary">bun run telegram:polling</code> instead — it does
                not require a public HTTPS endpoint.
              </Callout>
            </Step>

            <Step number={5} title="Start JARVIS and Test">
              <p className="mb-2">
                Start the server and send a test message to your new bot on Telegram.
              </p>
              <CodeBlock code="bun run dev" />
              <p className="mt-2">
                If everything is configured correctly, your bot will reply with a greeting from
                Claude within a few seconds.
              </p>
            </Step>
          </section>

          {/* Commands reference */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
              Built-in Bot Commands
            </h2>
            <div className="rounded-lg border border-bg-tertiary overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-secondary border-b border-bg-tertiary">
                    <th className="text-left px-4 py-3 text-text-secondary font-medium">Command</th>
                    <th className="text-left px-4 py-3 text-text-secondary font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A24]">
                  {[
                    { cmd: '/start', desc: 'Initialise the conversation and greet JARVIS' },
                    { cmd: '/reset', desc: 'Clear the current conversation memory' },
                    { cmd: '/persona <name>', desc: 'Switch to a different AI persona' },
                    { cmd: '/status', desc: 'Show JARVIS uptime and current model' },
                    { cmd: '/help', desc: 'List all available commands' },
                  ].map((row) => (
                    <tr key={row.cmd} className="hover:bg-bg-secondary transition-colors">
                      <td className="px-4 py-3 font-mono text-accent-primary">{row.cmd}</td>
                      <td className="px-4 py-3 text-text-secondary">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
              Troubleshooting
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Bot does not respond to messages',
                  a: 'Verify that TELEGRAM_BOT_TOKEN is set correctly and the webhook is registered. Check server logs for incoming webhook events.',
                  cmd: 'bun run telegram:webhook-info',
                },
                {
                  q: 'Webhook registration fails',
                  a: 'Telegram requires a public HTTPS URL for webhooks. For local testing switch to polling mode instead.',
                  cmd: 'bun run telegram:polling',
                },
                {
                  q: '"Unauthorized" error on startup',
                  a: 'Your bot token is invalid or has been revoked. Generate a new token via @BotFather using /token.',
                  cmd: null,
                },
                {
                  q: 'Messages cut off at 4096 characters',
                  a: 'This is a Telegram API limit. JARVIS automatically splits long replies into multiple messages. Adjust maxMessageLength in jarvis.config.ts if needed.',
                  cmd: null,
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
                { href: '/docs/quickstart', icon: '🚀', title: 'Quick Start', desc: 'Get JARVIS running in minutes' },
                { href: '/docs/memory', icon: '🧠', title: 'Memory System', desc: 'Persistent context across chats' },
                { href: '/docs/routing', icon: '🔀', title: 'Agent Routing', desc: 'Route tasks to specialised agents' },
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

          <Footer config={config} />
        </main>
      </div>
    </div>
  )
}
