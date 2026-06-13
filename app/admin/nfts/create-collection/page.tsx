'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CldUploadWidget } from 'next-cloudinary'
import { useNetwork, useNetworkSwitch } from '@/lib/wallet-context'
import { getConfig } from '@/lib/config'

type UploadInfo       = { secure_url: string }
type CollectionResult = { collectionMint: string; signature: string }

export default function CreateCollectionPage() {
  const router        = useRouter()
  const network       = useNetwork()
  const switchNetwork = useNetworkSwitch()
  const cfg           = getConfig(network)

  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl,    setImageUrl]    = useState('')
  const [creating,    setCreating]    = useState(false)
  const [result,      setResult]      = useState<CollectionResult | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
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
    if (!name.trim())  { setError('Name is required.'); return }
    if (!imageUrl)     { setError('Cover image is required.'); return }
    setError(null)
    setCreating(true)
    try {
      const res  = await fetch('/api/mint/collection', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), description: description.trim(), imageUrl, network }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Collection creation failed')
      setResult(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection')
    } finally {
      setCreating(false)
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
          <h1 className="admin-page-title">Create Collection</h1>
        </div></div>

        <div style={{ maxWidth: '560px' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: FONT_SYNE, fontWeight: 700, color: '#22c55e', marginBottom: '1rem' }}>Collection Created!</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontFamily: FONT_MONO, fontSize: '0.65rem' }}>
              <div>
                <span style={{ color: 'rgba(245,245,243,0.4)' }}>Mint </span>
                <span style={{ color: '#FF5C00', wordBreak: 'break-all' }}>{result.collectionMint}</span>
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
            <button className="btn-fire" onClick={() => router.push('/admin/nfts/mint-single')}>
              Mint NFT Into Collection
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
        <h1 className="admin-page-title">Create Collection</h1>
      </div></div>

      <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: '560px' }}>
        {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <div className="admin-form-section">
          <h2 className="admin-form-section-title">Collection Details</h2>

          <div className="form-g">
            <label>Name *</label>
            <input type="text" placeholder="Collection name" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="form-g">
            <label>Description</label>
            <textarea placeholder="Describe this collection…" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="form-g">
            <label>Cover Image *</label>
            {imageUrl ? (
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.75rem' }}>
                <img src={imageUrl} alt="Cover" style={{ maxWidth: '100%', maxHeight: 'calc(100% - 2.5rem)', objectFit: 'contain' }} />
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
                    <p className="upload-hint">Click to upload cover image</p>
                    <p className="upload-formats">PNG, JPG, WEBP</p>
                  </div>
                )}
              </CldUploadWidget>
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
          <button type="submit" className="btn-fire" disabled={creating}>
            {creating ? 'Creating…' : 'Create Collection'}
          </button>
          <button type="button" className="btn-outline" onClick={() => router.back()}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
