'use client'

import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { Collection } from '@/lib/supabase'

export default function CollectionsPage() {
  const { user } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  useEffect(() => { fetchCollections() }, [])

  async function fetchCollections() {
    setLoading(true)
    const { data } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false })
    setCollections(data ?? [])
    setLoading(false)
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    setError(null)
    setSaving(true)

    const { error: dbError } = await supabase.from('collections').insert({
      name: name.trim(),
      description: description.trim() || null,
      is_public: isPublic,
      creator_id: user?.id ?? null,
    })

    setSaving(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      setName('')
      setDescription('')
      setIsPublic(true)
      setShowForm(false)
      fetchCollections()
    }
  }

  async function handleTogglePublic(col: Collection) {
    const { error: dbError } = await supabase
      .from('collections')
      .update({ is_public: !col.is_public })
      .eq('id', col.id)
    if (!dbError) {
      setCollections(prev =>
        prev.map(c => c.id === col.id ? { ...c, is_public: !c.is_public } : c)
      )
    }
  }

  async function handleDelete(id: string, colName: string) {
    if (!window.confirm(`Delete collection "${colName}"? Artworks in it will not be deleted.`)) return
    setDeleting(id)
    await supabase.from('collections').delete().eq('id', id)
    setCollections(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="sec-label">Library</p>
          <h1 className="admin-page-title">Collections</h1>
        </div>
        <button
          className="btn-fire admin-action-btn"
          onClick={() => { setShowForm(v => !v); setError(null) }}
        >
          {showForm ? '✕ Cancel' : '+ New Collection'}
        </button>
      </div>

      {showForm && (
        <div className="admin-inline-form">
          <h2 className="admin-form-section-title">New Collection</h2>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleCreate} className="form">
            <div className="form-g">
              <label htmlFor="col-name">Name *</label>
              <input
                id="col-name"
                type="text"
                placeholder="Collection name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-g">
              <label htmlFor="col-desc">Description</label>
              <textarea
                id="col-desc"
                placeholder="Describe this collection…"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="admin-checkbox">
              <input
                id="col-public"
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
              />
              <label htmlFor="col-public">Publicly visible</label>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="btn-fire" disabled={saving}>
                {saving ? 'Creating…' : 'Create Collection'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="admin-loading"><span className="profile-spinner" /></div>
      ) : collections.length === 0 ? (
        <p className="admin-empty">No collections yet.</p>
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
              {collections.map(col => (
                <tr key={col.id}>
                  <td className="admin-td-title">{col.name}</td>
                  <td className="admin-td-muted">{col.description ?? '—'}</td>
                  <td>
                    <button
                      className={`status-badge ${col.is_public ? 'listed' : 'draft'} status-toggle`}
                      onClick={() => handleTogglePublic(col)}
                      title="Click to toggle"
                    >
                      {col.is_public ? 'Public' : 'Private'}
                    </button>
                  </td>
                  <td className="admin-td-muted">{new Date(col.created_at).toLocaleDateString()}</td>
                  <td className="admin-td-actions">
                    <button
                      onClick={() => handleDelete(col.id, col.name)}
                      disabled={deleting === col.id}
                      className="action-btn delete"
                    >
                      {deleting === col.id ? '…' : 'Delete'}
                    </button>
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
