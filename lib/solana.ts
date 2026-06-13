import type { Network } from './config'
import { NETWORK_STORAGE_KEY, getConfig } from './config'
import { Connection } from '@solana/web3.js'

export type { Network }
export { NETWORK_STORAGE_KEY, getConfig }

export function getConnection(network: Network): Connection {
  return new Connection(getConfig(network).rpc, 'confirmed')
}
