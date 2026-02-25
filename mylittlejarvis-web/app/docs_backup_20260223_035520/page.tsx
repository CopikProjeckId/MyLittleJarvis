import { Metadata } from 'next'
import { getConfig } from '@/lib/server-config'
import { DocsIndexClient } from './DocsIndexClient'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig()
  return {
    title: config.docs.meta.title,
    description: config.docs.meta.description,
  }
}

export default async function DocsPage() {
  const config = await getConfig()
  return <DocsIndexClient config={config} />
}
