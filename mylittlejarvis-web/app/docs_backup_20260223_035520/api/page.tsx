import { getConfig } from '@/lib/server-config'
import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export const metadata: Metadata = {
  title: 'API Reference - MyLittleJarvis Docs',
  description: 'Complete API documentation for integrating with JARVIS.',
}

type EndpointParam = {
  name: string
  type: string
  required: boolean
  description: string
}

type Endpoint = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  params?: EndpointParam[]
  body?: EndpointParam[]
  example: string
  response: string
}

type ApiSection = {
  id: string
  title: string
  icon: string
  description: string
  endpoints: Endpoint[]
}

const methodColors: Record<string, string> = {
  GET: 'bg-[#00D4AA]/10 text-accent-primary border-[#00D4AA]/20',
  POST: 'bg-[#7C3AED]/10 text-[#A78BFA] border-[#7C3AED]/20',
  PUT: 'bg-[#F59E0B]/10 text-[#FCD34D] border-[#F59E0B]/20',
  DELETE: 'bg-[#EF4444]/10 text-[#FCA5A5] border-[#EF4444]/20',
  PATCH: 'bg-[#3B82F6]/10 text-[#93C5FD] border-[#3B82F6]/20',
}

const apiSections: ApiSection[] = [
  {
    id: 'authentication',
    title: 'Authentication',
    icon: '🔑',
    description: 'All API requests require a bearer token. Pass your API key in the Authorization header.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/auth/token',
        description: 'Exchange your API key for a short-lived access token.',
        body: [
          { name: 'api_key', type: 'string', required: true, description: 'Your JARVIS API key from the dashboard.' },
        ],
        example: `curl -X POST https://api.mylittlejarvis.com/v1/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"api_key": "jrv_live_..."}'`,
        response: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}`,
      },
    ],
  },
  {
    id: 'messages',
    title: 'Messages',
    icon: '💬',
    description: 'Send messages to JARVIS and receive AI-generated responses.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/messages',
        description: 'Send a message to the active JARVIS persona and receive a response.',
        body: [
          { name: 'content', type: 'string', required: true, description: 'The message text to send.' },
          { name: 'persona', type: 'string', required: false, description: 'Persona slug to override the active persona.' },
          { name: 'session_id', type: 'string', required: false, description: 'Session ID for conversation continuity.' },
        ],
        example: `curl -X POST https://api.mylittlejarvis.com/v1/messages \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "What is the weather today?", "persona": "jarvis"}'`,
        response: `{
  "id": "msg_01XyzAbc",
  "role": "assistant",
  "content": "I'm checking live data for you...",
  "persona": "jarvis",
  "session_id": "sess_9xK2mNp",
  "created_at": "2025-01-01T00:00:00Z"
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/messages',
        description: 'Retrieve message history for a session.',
        params: [
          { name: 'session_id', type: 'string', required: true, description: 'The session to retrieve messages for.' },
          { name: 'limit', type: 'integer', required: false, description: 'Number of messages to return (default: 20, max: 100).' },
          { name: 'before', type: 'string', required: false, description: 'Cursor for pagination — return messages before this ID.' },
        ],
        example: `curl "https://api.mylittlejarvis.com/v1/messages?session_id=sess_9xK2mNp&limit=20" \\
  -H "Authorization: Bearer <token>"`,
        response: `{
  "data": [
    { "id": "msg_01XyzAbc", "role": "user", "content": "Hello", "created_at": "..." },
    { "id": "msg_01XyzDef", "role": "assistant", "content": "Hi there!", "created_at": "..." }
  ],
  "has_more": false
}`,
      },
    ],
  },
  {
    id: 'personas',
    title: 'Personas',
    icon: '🎭',
    description: 'Manage AI personas — create, update, list, and switch between them.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/personas',
        description: 'List all available personas for your account.',
        example: `curl https://api.mylittlejarvis.com/v1/personas \\
  -H "Authorization: Bearer <token>"`,
        response: `{
  "data": [
    { "id": "persona_abc", "slug": "jarvis", "name": "JARVIS", "active": true },
    { "id": "persona_def", "slug": "friday", "name": "FRIDAY", "active": false }
  ]
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/personas',
        description: 'Create a new custom persona.',
        body: [
          { name: 'name', type: 'string', required: true, description: 'Display name for the persona.' },
          { name: 'slug', type: 'string', required: true, description: 'Unique identifier slug (lowercase, hyphens).' },
          { name: 'system_prompt', type: 'string', required: true, description: 'System instructions that define the persona.' },
          { name: 'model', type: 'string', required: false, description: 'Claude model to use (default: claude-sonnet-4-6).' },
        ],
        example: `curl -X POST https://api.mylittlejarvis.com/v1/personas \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alfred", "slug": "alfred", "system_prompt": "You are Alfred, a refined British butler AI."}'`,
        response: `{
  "id": "persona_ghi",
  "slug": "alfred",
  "name": "Alfred",
  "model": "claude-sonnet-4-6",
  "created_at": "2025-01-01T00:00:00Z"
}`,
      },
    ],
  },
  {
    id: 'sessions',
    title: 'Sessions',
    icon: '🗂️',
    description: 'Sessions maintain conversation context across multiple messages.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/sessions',
        description: 'Create a new conversation session.',
        body: [
          { name: 'persona', type: 'string', required: false, description: 'Persona slug to use for this session.' },
          { name: 'metadata', type: 'object', required: false, description: 'Arbitrary key-value metadata to attach.' },
        ],
        example: `curl -X POST https://api.mylittlejarvis.com/v1/sessions \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"persona": "jarvis"}'`,
        response: `{
  "id": "sess_9xK2mNp",
  "persona": "jarvis",
  "created_at": "2025-01-01T00:00:00Z"
}`,
      },
      {
        method: 'DELETE',
        path: '/api/v1/sessions/:id',
        description: 'Delete a session and its associated message history.',
        example: `curl -X DELETE https://api.mylittlejarvis.com/v1/sessions/sess_9xK2mNp \\
  -H "Authorization: Bearer <token>"`,
        response: `{
  "deleted": true,
  "id": "sess_9xK2mNp"
}`,
      },
    ],
  },
]

export default async function ApiReferencePage() {
  const config = await getConfig()
  const page = config.docs.pages.api as {
    title?: string
    icon?: string
    content?: string
  } | undefined
  const sidebar = config.docs.sidebar

  const pageTitle = page?.title ?? 'API Reference'
  const pageIcon = page?.icon ?? '🔌'
  const pageContent = page?.content ?? 'Complete API documentation for integrating with JARVIS.'

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
                  const isActive = item.slug === 'api'
                  return (
                    <li key={item.slug}>
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
            <span className="text-text-secondary">Reference</span>
            <span>/</span>
            <span className="text-white">{pageTitle}</span>
          </nav>

          {/* Page title */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{pageIcon}</span>
              <h1 className="text-3xl font-bold text-white tracking-tight">{pageTitle}</h1>
            </div>
            <p className="text-text-secondary text-lg leading-relaxed">{pageContent}</p>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs bg-[#00D4AA]/10 text-accent-primary border border-[#00D4AA]/20 rounded-full px-3 py-1">
                Base URL: api.mylittlejarvis.com/v1
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-secondary border border-[#2A2A34] rounded-full px-3 py-1">
                REST · JSON
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-bg-tertiary text-text-secondary border border-[#2A2A34] rounded-full px-3 py-1">
                Bearer Auth
              </span>
            </div>
          </div>

          {/* On-page nav */}
          <div className="mb-10 p-4 rounded-xl border border-bg-tertiary bg-[#0D0D15]">
            <p className="text-xs text-[#606070] uppercase tracking-wider mb-3">On this page</p>
            <ul className="space-y-1.5">
              {apiSections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent-primary transition-colors"
                  >
                    <span>{s.icon}</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* API Sections */}
          <div className="space-y-14">
            {apiSections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-2 pb-2 border-b border-bg-tertiary">
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </h2>
                <p className="text-text-secondary text-sm mb-6">{section.description}</p>

                <div className="space-y-8">
                  {section.endpoints.map((ep, i) => (
                    <div key={i} className="rounded-xl border border-bg-tertiary bg-[#0D0D15] overflow-hidden">
                      {/* Endpoint header */}
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-bg-tertiary bg-[#111118]">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border font-mono ${methodColors[ep.method] ?? ''}`}>
                          {ep.method}
                        </span>
                        <code className="text-sm text-white font-mono">{ep.path}</code>
                      </div>

                      <div className="p-5 space-y-5">
                        <p className="text-[#C0C0D0] text-sm">{ep.description}</p>

                        {/* Query params */}
                        {ep.params && ep.params.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-[#606070] uppercase tracking-wider mb-2">Query Parameters</p>
                            <div className="rounded-lg overflow-hidden border border-bg-tertiary">
                              {ep.params.map((param, pi) => (
                                <div key={pi} className={`flex gap-3 px-4 py-2.5 text-sm ${pi % 2 === 0 ? 'bg-bg-primary' : 'bg-[#0D0D15]'}`}>
                                  <code className="text-accent-primary font-mono w-28 flex-shrink-0">{param.name}</code>
                                  <code className="text-[#A78BFA] font-mono w-16 flex-shrink-0 text-xs self-center">{param.type}</code>
                                  <span className={`text-xs self-center w-16 flex-shrink-0 ${param.required ? 'text-[#FCA5A5]' : 'text-[#606070]'}`}>
                                    {param.required ? 'required' : 'optional'}
                                  </span>
                                  <span className="text-text-secondary text-xs self-center">{param.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Body params */}
                        {ep.body && ep.body.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-[#606070] uppercase tracking-wider mb-2">Request Body</p>
                            <div className="rounded-lg overflow-hidden border border-bg-tertiary">
                              {ep.body.map((param, pi) => (
                                <div key={pi} className={`flex gap-3 px-4 py-2.5 text-sm ${pi % 2 === 0 ? 'bg-bg-primary' : 'bg-[#0D0D15]'}`}>
                                  <code className="text-accent-primary font-mono w-28 flex-shrink-0">{param.name}</code>
                                  <code className="text-[#A78BFA] font-mono w-16 flex-shrink-0 text-xs self-center">{param.type}</code>
                                  <span className={`text-xs self-center w-16 flex-shrink-0 ${param.required ? 'text-[#FCA5A5]' : 'text-[#606070]'}`}>
                                    {param.required ? 'required' : 'optional'}
                                  </span>
                                  <span className="text-text-secondary text-xs self-center">{param.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Example */}
                        <div>
                          <p className="text-xs font-semibold text-[#606070] uppercase tracking-wider mb-2">Example Request</p>
                          <div className="rounded-xl overflow-hidden border border-bg-tertiary">
                            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-bg-tertiary bg-[#111118]">
                              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
                              <span className="ml-2 text-xs text-[#606070]">curl</span>
                            </div>
                            <pre className="px-5 py-4 overflow-x-auto text-xs leading-relaxed bg-bg-primary">
                              <code className="text-[#C0C0D0] font-mono">{ep.example}</code>
                            </pre>
                          </div>
                        </div>

                        {/* Response */}
                        <div>
                          <p className="text-xs font-semibold text-[#606070] uppercase tracking-wider mb-2">Response</p>
                          <div className="rounded-xl overflow-hidden border border-bg-tertiary">
                            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-bg-tertiary bg-[#111118]">
                              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
                              <span className="ml-2 text-xs text-[#606070]">json</span>
                            </div>
                            <pre className="px-5 py-4 overflow-x-auto text-xs leading-relaxed bg-bg-primary">
                              <code className="text-accent-primary font-mono">{ep.response}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Prev / Next navigation */}
          <div className="mt-14 pt-8 border-t border-bg-tertiary grid grid-cols-2 gap-4">
            <Link
              href="/docs/personas"
              className="group flex flex-col p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">← Previous</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                🎭 AI Personas
              </span>
            </Link>
            <Link
              href="/docs/config"
              className="group flex flex-col items-end p-4 rounded-xl border border-bg-tertiary hover:border-[#00D4AA]/30 bg-[#0D0D15] hover:bg-[#00D4AA]/5 transition-all"
            >
              <span className="text-xs text-[#606070] mb-1">Next →</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent-primary transition-colors">
                ⚙️ Configuration
              </span>
            </Link>
          </div>

        </main>
      </div>
      <Footer config={config} />
    </div>
  )
}
