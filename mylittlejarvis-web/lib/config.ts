// 클라이언트용 - API 호출
import type { SiteConfig, DocsSidebarSection, DocsSidebarItem, DocsIndexSection } from './config-types'

export type { SiteConfig, DocsSidebarSection, DocsSidebarItem, DocsIndexSection } from './config-types'

export async function getConfig(): Promise<SiteConfig> {
  const response = await fetch('/api/config')
  if (!response.ok) {
    throw new Error('Failed to load config')
  }
  return response.json()
}
