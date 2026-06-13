'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Artwork } from '@/lib/supabase'

type StatusFilter = 'all' | 'draft' | 'listed' | 'sold'

const FILTERS: StatusFilter[] = ['all', 'draft', 'listed', 'sold']

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchArtworks()
  }, [filter])

  async function fetchArtworks() {
    setLoading(true)
    let query = supabase
      .from('artworks')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') query = query.eq('status', filter)

    const { data } = await query
    setArtworks(data ?? [])
    setLoading(false)
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(id)
    await supabase.from('artworks').delete().eq('id', id)
    setArtworks(prev => prev.filter(a => a.id !== id))
    setDeleting(null)
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="sec-label">Library</p>
          <h1 className="admin-page-title">Artworks</h1>
        </div>
        <Link href="/admin/artworks/new" className="btn-fire admin-action-btn">+ New Artwork</Link>
      </div>

      <div className="admin-filters">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`admin-filter-btn${filter === f ? ' active' : ''}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-loading"><span className="profile-spinner" /></div>
      ) : artworks.length === 0 ? (
        <p className="admin-empty">
          No artworks{filter !== 'all' ? ` with status "${filter}"` : ''}. {' '}
          <Link href="/admin/artworks/new" className="auth-link">Add one.</Link>
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>NFT</th>
                <th>SOL</th>
                <th>USDC</th>
                <th>IMOUT</th>
                <th>KART</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {artworks.map(art => (
                <tr key={art.id}>
                  <td className="admin-td-title">
                    {art.image_url && (
                      <img src={art.image_url} alt="" className="admin-thumb" />
                    )}
                    {art.title}
                  </td>
                  <td><span className={`status-badge ${art.status}`}>{art.status}</span></td>
                  <td className="admin-td-muted">{art.is_nft ? 'Yes' : '—'}</td>
                  <td className="admin-td-mono">{art.price_sol ?? '—'}</td>
                  <td className="admin-td-mono">{art.price_usdc ?? '—'}</td>
                  <td className="admin-td-mono">{art.price_imout ?? '—'}</td>
                  <td className="admin-td-mono">{art.price_kart ?? '—'}</td>
                  <td className="admin-td-muted">{new Date(art.created_at).toLocaleDateString()}</td>
                  <td className="admin-td-actions">
                    <Link href={`/admin/artworks/${art.id}/edit`} className="action-btn">Edit</Link>
                    <button
                      onClick={() => handleDelete(art.id, art.title)}
                      disabled={deleting === art.id}
                      className="action-btn delete"
                    >
                      {deleting === art.id ? '…' : 'Delete'}
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
