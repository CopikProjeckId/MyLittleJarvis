import { getConfig } from '@/lib/server-config'
import ClaudeBridgeClient from './ClaudeBridgeClient'

export default async function ClaudeBridgePage() {
  const config = await getConfig()
  return <ClaudeBridgeClient config={config} />
}
