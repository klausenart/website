'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  ConnectionProvider,
  WalletProvider as AdapterWalletProvider,
} from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import type { WalletError } from '@solana/wallet-adapter-base'
import { NETWORK_STORAGE_KEY, type Network } from './solana'

// ── Network context ───────────────────────────────────────────

type NetworkContextType = {
  network: Network
  setNetwork: (n: Network) => void
}

const NetworkContext = createContext<NetworkContextType>({
  network: 'mainnet',
  setNetwork: () => {},
})

export function useNetwork(): Network {
  return useContext(NetworkContext).network
}

export function useNetworkSwitch(): (n: Network) => void {
  return useContext(NetworkContext).setNetwork
}

// ── Provider ─────────────────────────────────────────────────

function onWalletError(error: WalletError) {
  // Surface errors in dev; swap for toast/analytics in prod
  console.error('[wallet-adapter]', error.name, error.message)
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<Network>('mainnet')

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(NETWORK_STORAGE_KEY)
    if (stored === 'mainnet' || stored === 'devnet') {
      setNetworkState(stored)
    }
  }, [])

  function setNetwork(n: Network) {
    setNetworkState(n)
    localStorage.setItem(NETWORK_STORAGE_KEY, n)
  }

  // Re-memoize endpoint whenever network changes so ConnectionProvider
  // creates a fresh Connection pointing at the right cluster.
  const endpoint = useMemo(
    () =>
      network === 'mainnet'
        ? (process.env.NEXT_PUBLIC_SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com')
        : 'https://api.devnet.solana.com',
    [network],
  )

  // Wallets array is stable across renders; only Phantom is supported.
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      <ConnectionProvider endpoint={endpoint}>
        <AdapterWalletProvider
          wallets={wallets}
          autoConnect
          onError={onWalletError}
        >
          {children}
        </AdapterWalletProvider>
      </ConnectionProvider>
    </NetworkContext.Provider>
  )
}
