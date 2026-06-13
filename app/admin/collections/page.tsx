'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type NFTCollection = {
  id:                  string
  name:                string
  nft_collection_mint: string | null
  network:             string | null
  created_at:          string
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<NFTCollection[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    fetch('/api/admin/collections')
      .then(r => r.json())
      .then(data => {
        setCollections(Array.isArray(data) ? data.filter((c: NFTCollection) => c.nft_collection_mint) : [])
        setLoading(false)
      })
  }, [])

  const FONT_MONO = "'Space Mono', monospace"

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="sec-label">Blockchain</p>
          <h1 className="admin-page-title">Collections</h1>
        </div>
        <Link
          href="/admin/nfts/create-collection"
          className="btn-fire"
          style={{ fontFamily: FONT_MONO, fontSize: '0.65rem', padding: '0.5rem 1rem', letterSpacing: '0.1em', textDecoration: 'none' }}
        >
          Create Collection
        </Link>
      </div>

      {loading ? (
        <span className="profile-spinner" />
      ) : collections.length === 0 ? (
        <p style={{ fontFamily: FONT_MONO, fontSize: '0.7rem', color: 'rgba(245,245,243,0.3)', padding: '3rem 0' }}>
          No NFT collections yet.{' '}
          <Link href="/admin/nfts/create-collection" style={{ color: '#FF5C00', textDecoration: 'none' }}>
            Create one →
          </Link>
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_MONO, fontSize: '0.65rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Name', 'Mint Address', 'Network', 'Created'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: 'rgba(245,245,243,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {collections.map(col => {
                const net    = col.network ?? 'mainnet'
                const solscan = col.nft_collection_mint
                  ? `https://solscan.io/account/${col.nft_collection_mint}${net === 'devnet' ? '?cluster=devnet' : ''}`
                  : null
                return (
                  <tr key={col.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem', color: '#F5F5F3' }}>{col.name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {col.nft_collection_mint && solscan ? (
                        <a
                          href={solscan}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#FF5C00', textDecoration: 'none' }}
                        >
                          {col.nft_collection_mint.slice(0, 8)}…{col.nft_collection_mint.slice(-6)}
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '2px 7px', borderRadius: '2px', fontSize: '0.55rem',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        background: net === 'mainnet' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                        color:      net === 'mainnet' ? '#22c55e' : '#eab308',
                        border:     `1px solid ${net === 'mainnet' ? '#22c55e' : '#eab308'}`,
                      }}>
                        {net}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'rgba(245,245,243,0.4)' }}>
                      {col.created_at ? new Date(col.created_at).toLocaleDateString('de-AT') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
