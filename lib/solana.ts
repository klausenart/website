import { Connection, clusterApiUrl } from '@solana/web3.js'

export const NETWORK_STORAGE_KEY = 'klausenart_network'

export type Network = 'mainnet' | 'devnet'

export const TOKEN_MINTS = {
  USDC:  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  IMOUT: 'DACYVx34V5aQaehN3MZGYxPfoyQYHZSnFAFw3T2Vbonk',
  KART:  'GDzfemoYR5GkbK4YupYpyq3E8Du9fSfKXxKDpkdrqGjs',
} as const

export function getConnection(network: Network): Connection {
  const endpoint =
    network === 'mainnet'
      ? (process.env.NEXT_PUBLIC_SOLANA_RPC ?? clusterApiUrl('mainnet-beta'))
      : clusterApiUrl('devnet')
  return new Connection(endpoint, 'confirmed')
}
