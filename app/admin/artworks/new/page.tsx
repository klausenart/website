'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CldUploadWidget } from 'next-cloudinary'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { Collection } from '@/lib/supabase'

type UploadInfo = { secure_url: string; public_id: string; resource_type: string }

export default function NewArtworkPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [priceSol, setPriceSol] = useState('')
  const [priceUsdc, setPriceUsdc] = useState('')
  const [priceImout, setPriceImout] = useState('')
  const [priceKart, setPriceKart] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [isNft, setIsNft] = useState(false)
  const [status, setStatus] = useState<'draft' | 'listed'>('draft')
  const [collections, setCollections] = useState<Collection[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('collections').select('id, name').order('name').then(({ data }) => {
      setCollections(data ?? [])
    })
  }, [])

  function handleUploadSuccess(results: unknown, setter: (url: string) => void) {
    const info = (results as { info: UploadInfo }).info
    if (info && typeof info === 'object' && info.secure_url) {
      setter(info.secure_url)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    setError(null)
    setSaving(true)

    const { error: dbError } = await supabase.from('artworks').insert({
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl || null,
      video_url: videoUrl || null,
      price_sol: priceSol ? parseFloat(priceSol) : null,
      price_usdc: priceUsdc ? parseFloat(priceUsdc) : null,
      price_imout: priceImout ? parseFloat(priceImout) : null,
      price_kart: priceKart ? parseFloat(priceKart) : null,
      collection_id: collectionId || null,
      is_nft: isNft,
      status,
      creator_id: user?.id ?? null,
    })

    setSaving(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      router.push('/admin/artworks')
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="sec-label">Artworks</p>
          <h1 className="admin-page-title">New Artwork</h1>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        {/* Core fields */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">Details</h2>
          <div className="form-g">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              placeholder="Artwork title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-g">
            <label htmlFor="desc">Description</label>
            <textarea
              id="desc"
              placeholder="Describe this piece…"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Media uploads */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">Media</h2>

          <div className="upload-row">
            <div className="upload-block">
              <p className="upload-label">Image</p>
              {imageUrl ? (
                <div className="upload-preview">
                  <img src={imageUrl} alt="Preview" className="upload-preview-img" />
                  <button type="button" className="upload-remove" onClick={() => setImageUrl('')}>Remove</button>
                </div>
              ) : (
                <CldUploadWidget
                  uploadPreset="klausenart"
                  options={{ cloudName: 'dfezolw0h', resourceType: 'image', multiple: false } as object}
                  onSuccess={results => handleUploadSuccess(results, setImageUrl)}
                >
                  {({ open }) => (
                    <div className="upload-zone" onClick={() => open()}>
                      <span className="upload-icon">↑</span>
                      <p className="upload-hint">Click to upload image</p>
                      <p className="upload-formats">PNG, JPG, WEBP, GIF</p>
                    </div>
                  )}
                </CldUploadWidget>
              )}
            </div>

            <div className="upload-block">
              <p className="upload-label">Video <span className="upload-optional">(optional)</span></p>
              {videoUrl ? (
                <div className="upload-preview">
                  <video src={videoUrl} controls className="upload-preview-video" />
                  <button type="button" className="upload-remove" onClick={() => setVideoUrl('')}>Remove</button>
                </div>
              ) : (
                <CldUploadWidget
                  uploadPreset="klausenart"
                  options={{ cloudName: 'dfezolw0h', resourceType: 'video', multiple: false } as object}
                  onSuccess={results => handleUploadSuccess(results, setVideoUrl)}
                >
                  {({ open }) => (
                    <div className="upload-zone" onClick={() => open()}>
                      <span className="upload-icon">▶</span>
                      <p className="upload-hint">Click to upload video</p>
                      <p className="upload-formats">MP4, MOV, WEBM</p>
                    </div>
                  )}
                </CldUploadWidget>
              )}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">Pricing</h2>
          <div className="price-grid">
            {[
              { id: 'sol', label: 'SOL', value: priceSol, setter: setPriceSol },
              { id: 'usdc', label: 'USDC', value: priceUsdc, setter: setPriceUsdc },
              { id: 'imout', label: 'IMOUT', value: priceImout, setter: setPriceImout },
              { id: 'kart', label: 'KART', value: priceKart, setter: setPriceKart },
            ].map(({ id, label, value, setter }) => (
              <div key={id} className="form-g">
                <label htmlFor={`price-${id}`}>{label}</label>
                <input
                  id={`price-${id}`}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={value}
                  onChange={e => setter(e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Collection & flags */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">Metadata</h2>
          <div className="form-g">
            <label htmlFor="collection">Collection</label>
            <select
              id="collection"
              value={collectionId}
              onChange={e => setCollectionId(e.target.value)}
              className="admin-select"
            >
              <option value="">None</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-g">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value as 'draft' | 'listed')}
              className="admin-select"
            >
              <option value="draft">Draft</option>
              <option value="listed">Listed</option>
            </select>
          </div>
          <div className="admin-checkbox">
            <input
              id="is-nft"
              type="checkbox"
              checked={isNft}
              onChange={e => setIsNft(e.target.checked)}
            />
            <label htmlFor="is-nft">Is NFT</label>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="btn-fire" disabled={saving}>
            {saving ? 'Saving…' : 'Save Artwork'}
          </button>
          <button type="button" className="btn-outline" onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
