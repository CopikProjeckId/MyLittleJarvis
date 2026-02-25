import { Metadata } from 'next'
import { DocsClient } from './DocsClient'

// Define all possible doc slugs for static generation
export function generateStaticParams() {
  const slugs = [
    [], // /docs (index)
    ['quickstart'],
    ['install'],
    ['requirements'],
    ['architecture'],
    ['memory'],
    ['routing'],
    ['claude-bridge'],
    ['api'],
    ['api', 'agent-router'],
    ['api', 'multi-ollama'],
    ['api', 'memory-manager'],
    ['api', 'claude-bridge'],
    ['faq'],
    ['troubleshooting'],
    ['community'],
  ]
  
  return slugs.map(slug => ({ slug }))
}

export const metadata: Metadata = {
  title: 'Documentation - MyLittleJarvis',
  description: 'Complete documentation for JARVIS Agent v2.0 - installation guides, API reference, and tutorials.',
}

interface DocsPageProps {
  params: {
    slug: string[]
  }
}

export default function DocsPage({ params }: DocsPageProps) {
  const slug = params.slug?.join('/') || 'index'
  // Backup folder - simplified sidebar
  const sidebar = {
    title: 'Documentation',
    sections: []
  }
  return <DocsClient slug={slug} sidebar={sidebar} />
}
