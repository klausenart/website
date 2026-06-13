'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useNetwork, useNetworkSwitch } from '@/lib/wallet-context'
import { getConfig } from '@/lib/config'

type ArtworkOption        = { id: string; title: string }
type CollectionWithMint   = { id: string; name: string; nft_collection_mint: string | null }
type MintResult           = { mint: string; signature: string }

export default function MintSinglePage() {
  const router        = useRouter()
  const network       = useNetwork()
  const switchNetwork = useNetworkSwitch()
  const cfg           = getConfig(network)

  const [artworks,      setArtworks]      = useState<ArtworkOption[]>([])
  const [collections,   setCollections]   = useState<CollectionWithMint[]>([])
  const [artworkId,     setArtworkId]     = useState('')
  const [collectionMint, setCollectionMint] = useState('')
  const [minting,       setMinting]       = useState(false)
  const [result,        setResult]        = useState<MintResult | null>(null)
  const [error,         setError]         = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/artworks').then(r => r.json()),
      fetch('/api/admin/collections').then(r => r.json()),
    ]).then(([arts, cols]) => {
      console.log('[mint-single] artworks:', arts)
      console.log('[mint-single] collections:', cols)
      setArtworks(Array.isArray(arts) ? (arts as ArtworkOption[]) : [])
      setCollections(Array.isArray(cols) ? (cols as CollectionWithMint[]).filter(c => c.nft_collection_mint) : [])
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!artworkId) { setError('Select an artwork.'); return }
    setError(null)
    setMinting(true)
    try {
      const res  = await fetch('/api/mint/single', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ artworkId, collectionMint: collectionMint || undefined, network }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Minting failed')
      setResult(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Minting failed')
    } finally {
      setMinting(false)
    }
  }

  const FONT_MONO = "'Space Mono', monospace"
  const FONT_SYNE = "'Syne', sans-serif"
  const netColor  = (n: string) => n === 'mainnet' ? '#22c55e' : '#eab308'

  if (result) {
    return (
      <div className="admin-page">
        <div className="admin-page-head"><div>
          <p className="sec-label">NFTs</p>
          <h1 className="admin-page-title">Mint 1/1 NFT</h1>
        </div></div>

        <div style={{ maxWidth: '560px' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: FONT_SYNE, fontWeight: 700, color: '#22c55e', marginBottom: '1rem' }}>NFT Minted!</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontFamily: FONT_MONO, fontSize: '0.65rem' }}>
              <div>
                <span style={{ color: 'rgba(245,245,243,0.4)' }}>Mint </span>
                <span style={{ color: '#FF5C00', wordBreak: 'break-all' }}>{result.mint}</span>
              </div>
              <div>
                <span style={{ color: 'rgba(245,245,243,0.4)' }}>Tx </span>
                <a
                  href={`${cfg.explorerBase}/${result.signature}${network === 'devnet' ? '?cluster=devnet' : ''}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: '#FF5C00', wordBreak: 'break-all' }}
                >
                  {result.signature.slice(0, 20)}…
                </a>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-fire" onClick={() => { setResult(null); setArtworkId(''); setCollectionMint('') }}>
              Mint Another
            </button>
            <button className="btn-outline" onClick={() => router.push('/admin/nfts')}>
              Back to NFTs
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head"><div>
        <p className="sec-label">NFTs</p>
        <h1 className="admin-page-title">Mint 1/1 NFT</h1>
      </div></div>

      <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: '560px' }}>
        {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">NFT Details</h2>

          <div className="form-g">
            <label>Artwork *</label>
            <select className="admin-select" value={artworkId} onChange={e => setArtworkId(e.target.value)} required>
              <option value="">Select artwork…</option>
              {artworks.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>

          <div className="form-g">
            <label>
              Collection
              <span style={{ fontFamily: FONT_MONO, fontSize: '0.6rem', color: 'rgba(245,245,243,0.3)', marginLeft: '0.5rem' }}>optional</span>
            </label>
            <select className="admin-select" value={collectionMint} onChange={e => setCollectionMint(e.target.value)}>
              <option value="">No collection</option>
              {collections.map(c => (
                <option key={c.id} value={c.nft_collection_mint!}>{c.name}</option>
              ))}
            </select>
            {collections.length === 0 && (
              <p style={{ fontFamily: FONT_MONO, fontSize: '0.6rem', color: 'rgba(245,245,243,0.3)', marginTop: '0.35rem' }}>
                No collections with mint addresses yet.{' '}
                <a href="/admin/nfts/create-collection" style={{ color: '#FF5C00', textDecoration: 'none' }}>Create one →</a>
              </p>
            )}
          </div>
        </div>

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">Network</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(['mainnet', 'devnet'] as const).map(n => (
              <button key={n} type="button" onClick={() => switchNetwork(n)} style={{
                fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '0.5rem 1.1rem', borderRadius: '4px', cursor: 'pointer',
                border:      `1px solid ${network === n ? netColor(n) : 'rgba(255,255,255,0.08)'}`,
                background:  network === n ? `${netColor(n)}1a` : 'transparent',
                color:       network === n ? netColor(n) : 'rgba(245,245,243,0.4)',
              }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn-fire" disabled={minting}>
            {minting ? 'Minting…' : 'Mint NFT'}
          </button>
          <button type="button" className="btn-outline" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
