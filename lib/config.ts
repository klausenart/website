export type Network = 'mainnet' | 'devnet'

export const NETWORK_STORAGE_KEY = 'klausenart_network'

const MAINNET_CONFIG = {
  rpc: process.env.NEXT_PUBLIC_SOLANA_RPC_MAINNET || 'https://mainnet.helius-rpc.com/?api-key=9b1a948d-b996-4a05-9e12-6ce111e67a50',
  usdc:  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  imout: 'DACYVx34V5aQaehN3MZGYxPfoyQYHZSnFAFw3T2Vbonk',
  kart:  'GDzfemoYR5GkbK4YupYpyq3E8Du9fSfKXxKDpkdrqGjs',
  storeWallet: 'B5C33f2zQb6qpVjJ3bgDTaKq8hQT1CGKv4qQvgWtYKBG',
  explorerBase: 'https://solscan.io',
}

const DEVNET_CONFIG = {
  rpc: 'https://api.devnet.solana.com',
  usdc:  null,
  imout: null,
  kart:  null,
  storeWallet: 'B5C33f2zQb6qpVjJ3bgDTaKq8hQT1CGKv4qQvgWtYKBG',
  explorerBase: 'https://solscan.io/tx',
}

export const CONFIGS = { mainnet: MAINNET_CONFIG, devnet: DEVNET_CONFIG }
export function getConfig(network: Network) { return CONFIGS[network] }
