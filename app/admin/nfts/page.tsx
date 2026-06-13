'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Artwork } from '@/lib/supabase'

type NFTRow = Artwork & { collection_name: string | null }

export default function AdminNFTsPage() {
  const [nfts,    setNfts]    = useState<NFTRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: arts, error }, colsData] = await Promise.all([
        supabase.from('artworks').select('*').eq('is_nft', true).order('created_at', { ascending: false }),
        fetch('/api/admin/collections').then(r => r.json()),
      ])

      if (error) { console.error('[admin/nfts]', error.message); setLoading(false); return }

      const nftCols: { name: string; nft_collection_mint: string | null }[] =
        Array.isArray(colsData) ? colsData : []

      setNfts((arts ?? []).map(a => ({
        ...a,
        collection_name: a.nft_collection_mint
          ? (nftCols.find(c => c.nft_collection_mint === a.nft_collection_mint)?.name ?? null)
          : null,
      })))
      setLoading(false)
    }
    load()
  }, [])

  const FONT_MONO = "'Space Mono', monospace"

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="sec-label">Blockchain</p>
          <h1 className="admin-page-title">NFTs</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/admin/nfts/mint-single" className="btn-outline"
            style={{ fontFamily: FONT_MONO, fontSize: '0.65rem', padding: '0.5rem 1rem', letterSpacing: '0.1em', textDecoration: 'none' }}>
            Mint 1/1 NFT
          </Link>
          <Link href="/admin/nfts/hot-mint" className="btn-fire"
            style={{ fontFamily: FONT_MONO, fontSize: '0.65rem', padding: '0.5rem 1rem', letterSpacing: '0.1em', textDecoration: 'none' }}>
            Hot Mint
          </Link>
        </div>
      </div>

      {loading ? (
        <span className="profile-spinner" />
      ) : nfts.length === 0 ? (
        <p style={{ fontFamily: FONT_MONO, fontSize: '0.7rem', color: 'rgba(245,245,243,0.3)', padding: '3rem 0' }}>
          No NFTs minted yet.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_MONO, fontSize: '0.65rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Title', 'Mint Address', 'Collection', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: 'rgba(245,245,243,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nfts.map(nft => (
                <tr key={nft.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem', color: '#F5F5F3' }}>
                    <Link href={`/admin/artworks/${nft.id}/edit`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {nft.title}
                    </Link>
                  </td>
                  <td style={{ padding: '0.75rem', color: nft.nft_mint_address ? '#FF5C00' : 'rgba(245,245,243,0.2)' }}>
                    {nft.nft_mint_address
                      ? `${nft.nft_mint_address.slice(0, 8)}…${nft.nft_mint_address.slice(-6)}`
                      : '—'}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'rgba(245,245,243,0.55)' }}>
                    {nft.collection_name ?? '—'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '2px 7px', borderRadius: '2px', fontSize: '0.55rem',
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      background: nft.nft_mint_address ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                      color:      nft.nft_mint_address ? '#22c55e' : '#eab308',
                      border:     `1px solid ${nft.nft_mint_address ? '#22c55e' : '#eab308'}`,
                    }}>
                      {nft.nft_mint_address ? 'Minted' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
