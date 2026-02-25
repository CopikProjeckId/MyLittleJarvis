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

type CommandFlag = { flag: string; desc: string; default?: string }

function CommandCard({
  name,
  description,
  usage,
  flags,
  example,
}: {
  name: string
  description: string
  usage: string
  flags?: CommandFlag[]
  example?: string
}) {
  return (
    <div className="rounded-lg border border-bg-tertiary bg-bg-secondary overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-bg-tertiary flex items-center gap-3">
        <code className="text-accent-primary font-mono font-semibold text-sm">{name}</code>
        <span className="text-[#4A4A6A] text-xs">—</span>
        <span className="text-text-secondary text-xs">{description}</span>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div>
          <p className="text-xs text-[#4A4A6A] uppercase tracking-wider mb-1">Usage</p>
          <code className="text-sm font-mono text-[#E0E0F0]">{usage}</code>
        </div>
        {flags && flags.length > 0 && (
          <div>
            <p className="text-xs text-[#4A4A6A] uppercase tracking-wider mb-2">Flags</p>
            <div className="space-y-1.5">
              {flags.map((f) => (
                <div key={f.flag} className="flex items-start gap-3 text-sm">
                  <code className="text-accent-primary font-mono shrink-0 w-40">{f.flag}</code>
                  <span className="text-text-secondary">{f.desc}</span>
                  {f.default && (
                    <span className="text-[#4A4A6A] text-xs ml-auto shrink-0">
                      default: <code className="text-[#6A6A8A]">{f.default}</code>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {example && (
          <div>
            <p className="text-xs text-[#4A4A6A] uppercase tracking-wider mb-1">Example</p>
            <CodeBlock code={example} />
          </div>
        )}
      </div>
    </div>
  )
}

export default async function CLIPage() {
  const config = await getConfig()
  const cliConfig = (config.docs.pages as Record<string, { title?: string; icon?: string } | undefined>).cli
  const sidebar = config.docs.sidebar

  const pageTitle = cliConfig?.title ?? 'CLI Reference'

  return (
    <div className="docs-container font-['Space_Grotesk',sans-serif]">
      <Header config={config} />

      {/* Layout */}
      <div className="docs-layout">
        {/* Sidebar */}
        <DocsSidebar sidebar={sidebar} currentSlug="cli" />

        {/* Main content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-8 py-10 max-w-3xl w-full">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#4A4A6A] mb-6">
            <Link href="/docs" className="hover:text-accent-primary transition-colors">Docs</Link>
            <span>/</span>
            <span className="text-text-secondary">CLI Reference</span>
          </nav>

          {/* Page header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-accent-primary text-xs font-medium mb-4">
              💻 Guides
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{pageTitle}</h1>
            <p className="text-text-secondary text-base leading-relaxed">
              Complete reference for the JARVIS command-line interface. All commands, flags, and
              examples — everything you need to control your JARVIS instance from the terminal.
            </p>
          </div>

          {/* Global Usage */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
              Global Usage
            </h2>
            <CodeBlock code="jarvis [command] [flags]" />
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              All commands accept the following global flags:
            </p>
            <div className="rounded-lg border border-bg-tertiary bg-bg-secondary divide-y divide-[#1A1A24]">
              {[
                { flag: '--config, -c', desc: 'Path to config file', default: '.env' },
                { flag: '--verbose, -v', desc: 'Enable verbose logging' },
                { flag: '--quiet, -q', desc: 'Suppress all output except errors' },
                { flag: '--help, -h', desc: 'Show help for the command' },
                { flag: '--version', desc: 'Print JARVIS version and exit' },
              ].map((f) => (
                <div key={f.flag} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <code className="text-accent-primary font-mono w-44 shrink-0">{f.flag}</code>
                  <span className="text-text-secondary flex-1">{f.desc}</span>
                  {f.default && (
                    <span className="text-[#4A4A6A] text-xs">
                      default: <code className="text-[#6A6A8A]">{f.default}</code>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Core Commands */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-bg-tertiary">
              Core Commands
            </h2>

            <CommandCard
              name="jarvis start"
              description="Start the JARVIS agent server"
              usage="jarvis start [flags]"
              flags={[
                { flag: '--port, -p', desc: 'Port to listen on', default: '3000' },
                { flag: '--host', desc: 'Host address to bind', default: '0.0.0.0' },
                { flag: '--daemon, -d', desc: 'Run as background daemon' },
                { flag: '--persona', desc: 'Persona to load on startup', default: 'default' },
              ]}
              example={`# Start on default port\njarvis start\n\n# Start on a custom port in daemon mode\njarvis start --port 4000 --daemon`}
            />

            <CommandCard
              name="jarvis stop"
              description="Stop a running JARVIS daemon"
              usage="jarvis stop [flags]"
              flags={[
                { flag: '--pid', desc: 'PID of the daemon to stop' },
                { flag: '--force, -f', desc: 'Force kill without graceful shutdown' },
              ]}
              example={`# Graceful stop\njarvis stop\n\n# Force kill\njarvis stop --force`}
            />

            <CommandCard
              name="jarvis status"
              description="Show the current status of the JARVIS daemon"
              usage="jarvis status [flags]"
              flags={[
                { flag: '--json', desc: 'Output status as JSON' },
              ]}
              example="jarvis status --json"
            />
          </section>

          {/* Persona Commands */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-bg-tertiary">
              Persona Commands
            </h2>

            <CommandCard
              name="jarvis personas list"
              description="List all available AI personas"
              usage="jarvis personas list [flags]"
              flags={[
                { flag: '--json', desc: 'Output as JSON array' },
              ]}
              example="jarvis personas list"
            />

            <CommandCard
              name="jarvis personas set"
              description="Set the active persona"
              usage="jarvis personas set --name <persona>"
              flags={[
                { flag: '--name, -n', desc: 'Name of the persona to activate' },
              ]}
              example={`jarvis personas set --name jarvis\njarvis personas set --name friday`}
            />

            <CommandCard
              name="jarvis personas create"
              description="Create a new custom persona"
              usage="jarvis personas create --name <name> --prompt <file>"
              flags={[
                { flag: '--name, -n', desc: 'Unique identifier for the persona' },
                { flag: '--prompt, -p', desc: 'Path to system prompt file (.md or .txt)' },
                { flag: '--model', desc: 'Claude model to use', default: 'claude-sonnet-4-6' },
              ]}
              example={`# Create from a prompt file\njarvis personas create --name myceo --prompt ./prompts/ceo.md`}
            />
          </section>

          {/* Memory Commands */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-bg-tertiary">
              Memory Commands
            </h2>

            <CommandCard
              name="jarvis memory list"
              description="List stored memory entries"
              usage="jarvis memory list [flags]"
              flags={[
                { flag: '--limit, -l', desc: 'Max entries to return', default: '20' },
                { flag: '--tag', desc: 'Filter by tag' },
                { flag: '--json', desc: 'Output as JSON' },
              ]}
              example={`jarvis memory list --limit 50 --tag work`}
            />

            <CommandCard
              name="jarvis memory clear"
              description="Clear memory entries"
              usage="jarvis memory clear [flags]"
              flags={[
                { flag: '--all', desc: 'Clear all memory (irreversible)' },
                { flag: '--tag', desc: 'Clear only entries with this tag' },
                { flag: '--before', desc: 'Clear entries older than date (YYYY-MM-DD)' },
              ]}
              example={`# Clear old entries\njarvis memory clear --before 2025-01-01\n\n# Clear everything\njarvis memory clear --all`}
            />

            <Callout type="warning">
              <code>jarvis memory clear --all</code> permanently removes all memory. This action
              cannot be undone. Consider exporting first with{' '}
              <code className="text-accent-primary">jarvis memory export</code>.
            </Callout>

            <CommandCard
              name="jarvis memory export"
              description="Export memory to a JSON file"
              usage="jarvis memory export [flags]"
              flags={[
                { flag: '--output, -o', desc: 'Output file path', default: 'memory.json' },
              ]}
              example={`jarvis memory export --output ./backup/memory-$(date +%F).json`}
            />
          </section>

          {/* Logs */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-bg-tertiary">
              Log Commands
            </h2>

            <CommandCard
              name="jarvis logs"
              description="Stream or tail JARVIS logs"
              usage="jarvis logs [flags]"
              flags={[
                { flag: '--follow, -f', desc: 'Stream logs in real time' },
                { flag: '--lines, -n', desc: 'Number of historical lines to show', default: '50' },
                { flag: '--level', desc: 'Minimum log level (debug|info|warn|error)', default: 'info' },
              ]}
              example={`# Follow live logs\njarvis logs --follow\n\n# Show last 100 error lines\njarvis logs --lines 100 --level error`}
            />
          </section>

          {/* Update & Config */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-bg-tertiary">
              Update &amp; Config
            </h2>

            <CommandCard
              name="jarvis update"
              description="Update JARVIS to the latest version"
              usage="jarvis update [flags]"
              flags={[
                { flag: '--check', desc: 'Check for updates without installing' },
                { flag: '--yes, -y', desc: 'Skip confirmation prompt' },
              ]}
              example={`# Check for update\njarvis update --check\n\n# Update without prompt\njarvis update --yes`}
            />

            <CommandCard
              name="jarvis config get"
              description="Print a config value"
              usage="jarvis config get <key>"
              example={`jarvis config get JARVIS_PORT\njarvis config get JARVIS_PERSONA`}
            />

            <CommandCard
              name="jarvis config set"
              description="Set a config value in your .env file"
              usage="jarvis config set <key> <value>"
              example={`jarvis config set JARVIS_PORT 4000\njarvis config set LOG_LEVEL debug`}
            />

            <Callout type="tip">
              Run <code className="text-accent-primary">jarvis config set</code> while the daemon is
              running and then <code className="text-accent-primary">jarvis restart</code> to apply the
              new values without re-editing your <code>.env</code> file manually.
            </Callout>
          </section>

          {/* Next steps */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
              Next Steps
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { href: '/docs/install', icon: '⚙️', title: 'Installation', desc: 'Set up JARVIS from scratch' },
                { href: '/docs/architecture', icon: '🏗️', title: 'Architecture', desc: 'How JARVIS works under the hood' },
                { href: '/docs/api', icon: '📖', title: 'API Reference', desc: 'Explore HTTP endpoints' },
                { href: '/docs/troubleshooting', icon: '🔍', title: 'Troubleshooting', desc: 'Debugging and common errors' },
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
