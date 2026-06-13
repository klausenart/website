'use client'

import { useNetwork, useNetworkSwitch } from '@/lib/wallet-context'

export default function NetworkSwitcher() {
  const network      = useNetwork()
  const switchNetwork = useNetworkSwitch()

  function toggle() {
    switchNetwork(network === 'mainnet' ? 'devnet' : 'mainnet')
  }

  return (
    <button
      onClick={toggle}
      className="network-switcher"
      title={`Active: ${network} — click to switch to ${network === 'mainnet' ? 'devnet' : 'mainnet'}`}
    >
      <span className={`network-dot ${network}`} />
      <span className="network-label">{network}</span>
    </button>
  )
}
