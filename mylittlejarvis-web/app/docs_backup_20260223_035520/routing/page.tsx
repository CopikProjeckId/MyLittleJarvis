import { getConfig } from '@/lib/server-config'
import { RoutingClient } from './RoutingClient'

export default async function RoutingPage() {
  const config = await getConfig()
  return <RoutingClient config={config} />
}
