'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CldUploadWidget } from 'next-cloudinary'
import { supabase } from '@/lib/supabase'
type UploadInfo = { secure_url: string; public_id: string; resource_type: string }
type SeriesOption = { id: string; name: string }

export default function EditArtworkPage() {
  const router   = useRouter()
  const params   = useParams()
  const id       = Array.isArray(params.id) ? params.id[0] : params.id as string

  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [seriesList, setSeriesList] = useState<SeriesOption[]>([])

  // Form fields
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl,    setImageUrl]    = useState('')
  const [videoUrl,    setVideoUrl]    = useState('')
  const [priceSol,    setPriceSol]    = useState('')
  const [priceUsdc,   setPriceUsdc]   = useState('')
  const [priceImout,  setPriceImout]  = useState('')
  const [priceKart,   setPriceKart]   = useState('')
  const [seriesId,    setSeriesId]    = useState('')
  const [isNft,       setIsNft]       = useState(false)
  const [status,      setStatus]      = useState<'draft' | 'listed' | 'sold'>('draft')

  // Fetch artwork + series in parallel
  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('artworks').select('*').eq('id', id).single(),
      fetch('/api/admin/series').then(r => r.json()),
    ]).then(([{ data: art, error: artErr }, seriesData]) => {
      setSeriesList(Array.isArray(seriesData) ? seriesData : [])
      if (artErr || !art) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setTitle(art.title)
      setDescription(art.description ?? '')
      setImageUrl(art.image_url ?? '')
      setVideoUrl(art.video_url ?? '')
      setPriceSol(art.price_sol    != null ? String(art.price_sol)    : '')
      setPriceUsdc(art.price_usdc  != null ? String(art.price_usdc)   : '')
      setPriceImout(art.price_imout != null ? String(art.price_imout) : '')
      setPriceKart(art.price_kart  != null ? String(art.price_kart)   : '')
      setSeriesId(art.series_id ?? '')
      setIsNft(art.is_nft)
      setStatus(art.status)
      setLoading(false)
    })
  }, [id])

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

    const { error: dbError } = await supabase
      .from('artworks')
      .update({
        title:         title.trim(),
        description:   description.trim() || null,
        image_url:     imageUrl  || null,
        video_url:     videoUrl  || null,
        price_sol:     priceSol    ? parseFloat(priceSol)    : null,
        price_usdc:    priceUsdc   ? parseFloat(priceUsdc)   : null,
        price_imout:   priceImout  ? parseFloat(priceImout)  : null,
        price_kart:    priceKart   ? parseFloat(priceKart)   : null,
        series_id: seriesId || null,
        is_nft:        isNft,
        status,
      })
      .eq('id', id)

    setSaving(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      router.push('/admin/artworks')
    }
  }

  // ── Loading / not found ──────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading"><span className="profile-spinner" /></div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="admin-page">
        <p className="admin-empty">Artwork not found.</p>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="sec-label">Artworks</p>
          <h1 className="admin-page-title">Edit Artwork</h1>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="admin-form">

        {/* Details */}
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

        {/* Media */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">Media</h2>
          <div className="upload-row">

            <div className="upload-block">
              <p className="upload-label">Image</p>
              {imageUrl ? (
                <div className="upload-preview">
                  <img src={imageUrl} alt="Preview" className="upload-preview-img" />
                  <button type="button" className="upload-remove" onClick={() => setImageUrl('')}>
                    Remove
                  </button>
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
                  <button type="button" className="upload-remove" onClick={() => setVideoUrl('')}>
                    Remove
                  </button>
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
              { id: 'sol',   label: 'SOL',   value: priceSol,   setter: setPriceSol   },
              { id: 'usdc',  label: 'USDC',  value: priceUsdc,  setter: setPriceUsdc  },
              { id: 'imout', label: 'IMOUT', value: priceImout, setter: setPriceImout },
              { id: 'kart',  label: 'KART',  value: priceKart,  setter: setPriceKart  },
            ].map(({ id: fieldId, label, value, setter }) => (
              <div key={fieldId} className="form-g">
                <label htmlFor={`price-${fieldId}`}>{label}</label>
                <input
                  id={`price-${fieldId}`}
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

        {/* Metadata */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">Metadata</h2>
          <div className="form-g">
            <label htmlFor="series">Series</label>
            <select
              id="series"
              value={seriesId}
              onChange={e => setSeriesId(e.target.value)}
              className="admin-select"
            >
              <option value="">None</option>
              {seriesList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="form-g">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value as 'draft' | 'listed' | 'sold')}
              className="admin-select"
            >
              <option value="draft">Draft</option>
              <option value="listed">Listed</option>
              <option value="sold">Sold</option>
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
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" className="btn-outline" onClick={() => router.push('/admin/artworks')}>
            Cancel
          </button>
        </div>

      </form>
    </div>
  )
}
