'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CldUploadWidget } from 'next-cloudinary'
import { useNetwork, useNetworkSwitch } from '@/lib/wallet-context'
import { getConfig } from '@/lib/config'

type UploadInfo        = { secure_url: string }
type CollectionOption  = { id: string; name: string; nft_collection_mint: string | null }
type MintResult        = { mint: string; signature: string }

export default function HotMintPage() {
  const router        = useRouter()
  const network       = useNetwork()
  const switchNetwork = useNetworkSwitch()
  const cfg           = getConfig(network)

  const [name,           setName]           = useState('')
  const [description,    setDescription]    = useState('')
  const [imageUrl,       setImageUrl]       = useState('')
  const [collectionMint, setCollectionMint] = useState('')
  const [collections,    setCollections]    = useState<CollectionOption[]>([])
  const [minting,        setMinting]        = useState(false)
  const [result,         setResult]         = useState<MintResult | null>(null)
  const [error,          setError]          = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/collections')
      .then(r => r.json())
      .then(cols => {
        setCollections(Array.isArray(cols) ? (cols as CollectionOption[]).filter(c => c.nft_collection_mint) : [])
      })
    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.position = ''
      document.documentElement.style.overflow = 'auto'
    }
  }, [])

  function restoreScroll() {
    document.body.style.overflow = 'auto'
    document.body.style.position = ''
    document.documentElement.style.overflow = 'auto'
  }

  function handleUploadSuccess(results: unknown) {
    const info = (results as { info: UploadInfo }).info
    if (info?.secure_url) setImageUrl(info.secure_url)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    if (!imageUrl)    { setError('Image is required.'); return }
    setError(null)
    setMinting(true)
    try {
      const res  = await fetch('/api/mint/single', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:           name.trim(),
          description:    description.trim(),
          imageUrl,
          collectionMint: collectionMint || undefined,
          network,
        }),
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
          <h1 className="admin-page-title">Hot Mint</h1>
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
            <button className="btn-fire" onClick={() => { setResult(null); setName(''); setDescription(''); setImageUrl(''); setCollectionMint('') }}>
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
        <h1 className="admin-page-title">Hot Mint</h1>
      </div></div>

      <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: '560px' }}>
        {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">NFT Details</h2>

          <div className="form-g">
            <label>Name *</label>
            <input type="text" placeholder="NFT name" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="form-g">
            <label>Description</label>
            <textarea placeholder="Describe this NFT…" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="form-g">
            <label>Image *</label>
            {imageUrl ? (
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.75rem' }}>
                <img src={imageUrl} alt="NFT" style={{ maxWidth: '100%', maxHeight: 'calc(100% - 2.5rem)', objectFit: 'contain' }} />
                <button type="button" className="upload-remove" onClick={() => setImageUrl('')}>Remove</button>
              </div>
            ) : (
              <CldUploadWidget
                uploadPreset="klausenart"
                options={{ cloudName: 'dfezolw0h', resourceType: 'image', multiple: false, showUploadMoreButton: false, singleUploadAutoClose: false } as object}
                onSuccess={handleUploadSuccess}
                onClose={restoreScroll}
              >
                {({ open }) => (
                  <div className="upload-zone" onClick={() => open()}>
                    <span className="upload-icon">↑</span>
                    <p className="upload-hint">Click to upload image</p>
                    <p className="upload-formats">PNG, JPG, WEBP</p>
                  </div>
                )}
              </CldUploadWidget>
            )}
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
                No collections yet.{' '}
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
                border:     `1px solid ${network === n ? netColor(n) : 'rgba(255,255,255,0.08)'}`,
                background: network === n ? `${netColor(n)}1a` : 'transparent',
                color:      network === n ? netColor(n) : 'rgba(245,245,243,0.4)',
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
