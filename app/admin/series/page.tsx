'use client'

import { useEffect, useState, FormEvent, Fragment } from 'react'
import { useAuth } from '@/lib/auth-context'

type SeriesRow = {
  id:          string
  name:        string
  description: string | null
  is_public:   boolean
  created_at:  string
}

type ArtworkOption = {
  id:        string
  title:     string
  series_id: string | null
}

const FONT_MONO = "'Space Mono', monospace"

export default function SeriesPage() {
  const { user } = useAuth()

  const [series,        setSeries]        = useState<SeriesRow[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState<string | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const [artworks,      setArtworks]      = useState<ArtworkOption[]>([])
  const [artworksReady, setArtworksReady] = useState(false)
  const [addSelect,     setAddSelect]     = useState<Record<string, string>>({})

  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [isPublic,    setIsPublic]    = useState(true)

  useEffect(() => { fetchSeries() }, [])

  async function fetchSeries() {
    setLoading(true)
    const res  = await fetch('/api/admin/series')
    const data = await res.json()
    setSeries(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function ensureArtworks() {
    if (artworksReady) return
    const res  = await fetch('/api/admin/artworks')
    const data = await res.json()
    setArtworks(Array.isArray(data) ? data : [])
    setArtworksReady(true)
  }

  function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    ensureArtworks()
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    setError(null)
    setSaving(true)

    const res  = await fetch('/api/admin/series', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:        name.trim(),
        description: description.trim() || null,
        is_public:   isPublic,
        creator_id:  user?.id ?? null,
      }),
    })
    const json = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(json.error ?? 'Failed to create series')
    } else {
      setName('')
      setDescription('')
      setIsPublic(true)
      setShowForm(false)
      fetchSeries()
    }
  }

  async function handleTogglePublic(row: SeriesRow) {
    await fetch(`/api/admin/series?id=${row.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_public: !row.is_public }),
    })
    setSeries(prev => prev.map(s => s.id === row.id ? { ...s, is_public: !s.is_public } : s))
  }

  async function handleDelete(id: string, seriesName: string) {
    if (!window.confirm(`Delete series "${seriesName}"? Artworks in it will not be deleted.`)) return
    setDeleting(id)
    await fetch(`/api/admin/series?id=${id}`, { method: 'DELETE' })
    setSeries(prev => prev.filter(s => s.id !== id))
    if (expandedId === id) setExpandedId(null)
    setDeleting(null)
  }

  async function handleAddArtwork(seriesId: string) {
    const artworkId = addSelect[seriesId]
    if (!artworkId) return
    await fetch(`/api/admin/artworks?id=${artworkId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ series_id: seriesId }),
    })
    setArtworks(prev => prev.map(a => a.id === artworkId ? { ...a, series_id: seriesId } : a))
    setAddSelect(prev => ({ ...prev, [seriesId]: '' }))
  }

  async function handleRemoveArtwork(artworkId: string) {
    await fetch(`/api/admin/artworks?id=${artworkId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ series_id: null }),
    })
    setArtworks(prev => prev.map(a => a.id === artworkId ? { ...a, series_id: null } : a))
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="sec-label">Library</p>
          <h1 className="admin-page-title">Series</h1>
        </div>
        <button
          className="btn-fire admin-action-btn"
          onClick={() => { setShowForm(v => !v); setError(null) }}
        >
          {showForm ? '✕ Cancel' : '+ New Series'}
        </button>
      </div>

      {showForm && (
        <div className="admin-inline-form">
          <h2 className="admin-form-section-title">New Series</h2>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleCreate} className="form">
            <div className="form-g">
              <label htmlFor="ser-name">Name *</label>
              <input
                id="ser-name"
                type="text"
                placeholder="Series name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-g">
              <label htmlFor="ser-desc">Description</label>
              <textarea
                id="ser-desc"
                placeholder="Describe this series…"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="admin-checkbox">
              <input
                id="ser-public"
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
              />
              <label htmlFor="ser-public">Publicly visible</label>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn-fire" disabled={saving}>
                {saving ? 'Creating…' : 'Create Series'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="admin-loading"><span className="profile-spinner" /></div>
      ) : series.length === 0 ? (
        <p className="admin-empty">No series yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Visibility</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {series.map(s => (
                <Fragment key={s.id}>
                  <tr>
                    <td className="admin-td-title">
                      <button
                        onClick={() => toggleExpand(s.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          fontFamily: FONT_MONO, fontSize: '0.65rem', color: '#F5F5F3',
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}
                      >
                        <span style={{ color: 'rgba(245,245,243,0.3)', fontSize: '0.6rem' }}>
                          {expandedId === s.id ? '▾' : '▸'}
                        </span>
                        {s.name}
                      </button>
                    </td>
                    <td className="admin-td-muted">{s.description ?? '—'}</td>
                    <td>
                      <button
                        className={`status-badge ${s.is_public ? 'listed' : 'draft'} status-toggle`}
                        onClick={() => handleTogglePublic(s)}
                        title="Click to toggle"
                      >
                        {s.is_public ? 'Public' : 'Private'}
                      </button>
                    </td>
                    <td className="admin-td-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="admin-td-actions">
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        disabled={deleting === s.id}
                        className="action-btn delete"
                      >
                        {deleting === s.id ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>

                  {expandedId === s.id && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: '0 0.75rem 1rem 2rem',
                          background: 'rgba(255,92,0,0.03)',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <p style={{ fontFamily: FONT_MONO, fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,245,243,0.3)', margin: '0.75rem 0 0.5rem' }}>
                          Artworks in this series
                        </p>

                        {artworksReady ? (
                          <>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                              {artworks.filter(a => a.series_id === s.id).length === 0 ? (
                                <span style={{ fontFamily: FONT_MONO, fontSize: '0.62rem', color: 'rgba(245,245,243,0.25)' }}>
                                  No artworks assigned yet.
                                </span>
                              ) : artworks.filter(a => a.series_id === s.id).map(a => (
                                <span
                                  key={a.id}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                    fontFamily: FONT_MONO, fontSize: '0.6rem',
                                    padding: '3px 8px', borderRadius: '3px',
                                    background: 'rgba(255,92,0,0.08)',
                                    border: '1px solid rgba(255,92,0,0.2)',
                                    color: '#F5F5F3',
                                  }}
                                >
                                  {a.title}
                                  <button
                                    onClick={() => handleRemoveArtwork(a.id)}
                                    style={{
                                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                      color: 'rgba(245,245,243,0.35)', fontSize: '0.65rem', lineHeight: 1,
                                    }}
                                    title="Remove from series"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <select
                                className="admin-select"
                                style={{ fontSize: '0.62rem', padding: '0.3rem 0.6rem' }}
                                value={addSelect[s.id] ?? ''}
                                onChange={e => setAddSelect(prev => ({ ...prev, [s.id]: e.target.value }))}
                              >
                                <option value="">Add artwork…</option>
                                {artworks
                                  .filter(a => a.series_id !== s.id)
                                  .map(a => (
                                    <option key={a.id} value={a.id}>
                                      {a.title}{a.series_id ? ' (in another series)' : ''}
                                    </option>
                                  ))
                                }
                              </select>
                              <button
                                className="btn-fire"
                                style={{ fontFamily: FONT_MONO, fontSize: '0.6rem', padding: '0.3rem 0.75rem' }}
                                onClick={() => handleAddArtwork(s.id)}
                                disabled={!addSelect[s.id]}
                              >
                                Add
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className="profile-spinner" style={{ width: '16px', height: '16px' }} />
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
