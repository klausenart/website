'use client'

import { useNetwork, useNetworkSwitch } from '@/lib/wallet-context'

const COLORS: Record<string, string> = {
  mainnet: '#22c55e',
  devnet:  '#eab308',
}

export default function NetworkSwitcher() {
  const network       = useNetwork()
  const switchNetwork = useNetworkSwitch()
  const color         = COLORS[network]
  const target        = network === 'mainnet' ? 'devnet' : 'mainnet'

  function handleClick() {
    console.log('[NetworkSwitcher] click — current:', network, '→ switching to:', target)
    switchNetwork(target)
    console.log('[NetworkSwitcher] switchNetwork called')
  }

  return (
    <button
      onClick={handleClick}
      aria-label={`Network: ${network}. Click to switch to ${target}.`}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '0.5rem',
        width:          '130px',
        padding:        '0.5rem 1rem',
        background:     'transparent',
        border:         `1px solid ${color}`,
        cursor:         'pointer',
        fontFamily:     "'Space Mono', monospace",
        fontSize:       '0.65rem',
        letterSpacing:  '0.15em',
        textTransform:  'uppercase',
        color:          color,
        boxSizing:      'border-box',
      }}
    >
      <span style={{
        width:        '7px',
        height:       '7px',
        borderRadius: '50%',
        flexShrink:   0,
        background:   color,
        boxShadow:    `0 0 6px ${color}`,
      }} />
      {network}
    </button>
  )
}
