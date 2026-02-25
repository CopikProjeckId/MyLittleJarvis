import { getConfig } from '@/lib/server-config'
import ArchitecturePageClient from './ArchitecturePageClient'

export default async function ArchitecturePage() {
  const config = await getConfig()
  return <ArchitecturePageClient config={config} />
}
