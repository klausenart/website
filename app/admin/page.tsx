'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Artwork } from '@/lib/supabase'

type Stats = {
  artworks: number
  listed: number
  collections: number
  transactions: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({ artworks: 0, listed: 0, collections: 0, transactions: 0 })
  const [recent, setRecent] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: artworks },
        { count: listed },
        { count: collections },
        { count: transactions },
        { data: recentArtworks },
      ] = await Promise.all([
        supabase.from('artworks').select('*', { count: 'exact', head: true }),
        supabase.from('artworks').select('*', { count: 'exact', head: true }).eq('status', 'listed'),
        supabase.from('collections').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
        supabase.from('artworks').select('*').order('created_at', { ascending: false }).limit(6),
      ])
      setStats({
        artworks: artworks ?? 0,
        listed: listed ?? 0,
        collections: collections ?? 0,
        transactions: transactions ?? 0,
      })
      setRecent(recentArtworks ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const STAT_CARDS = [
    { label: 'Total Artworks', value: stats.artworks, sub: null },
    { label: 'Listed', value: stats.listed, sub: 'available to buy' },
    { label: 'Collections', value: stats.collections, sub: null },
    { label: 'Transactions', value: stats.transactions, sub: null },
  ]

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <p className="sec-label">Dashboard</p>
        <h1 className="admin-page-title">Overview</h1>
      </div>

      {loading ? (
        <div className="admin-loading"><span className="profile-spinner" /></div>
      ) : (
        <>
          <div className="stat-cards">
            {STAT_CARDS.map(({ label, value, sub }) => (
              <div key={label} className="stat-card">
                <p className="stat-card-value">{value}</p>
                <p className="stat-card-label">{label}</p>
                {sub && <p className="stat-card-sub">{sub}</p>}
              </div>
            ))}
          </div>

          <div className="admin-section">
            <div className="admin-section-head">
              <h2 className="admin-section-title">Recent Artworks</h2>
              <Link href="/admin/artworks/new" className="btn-fire admin-action-btn">+ New Artwork</Link>
            </div>

            {recent.length === 0 ? (
              <p className="admin-empty">No artworks yet. <Link href="/admin/artworks/new" className="auth-link">Upload the first one.</Link></p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>SOL</th>
                      <th>USDC</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(art => (
                      <tr key={art.id}>
                        <td className="admin-td-title">{art.title}</td>
                        <td><span className={`status-badge ${art.status}`}>{art.status}</span></td>
                        <td className="admin-td-mono">{art.price_sol ?? '—'}</td>
                        <td className="admin-td-mono">{art.price_usdc ?? '—'}</td>
                        <td className="admin-td-muted">{new Date(art.created_at).toLocaleDateString()}</td>
                        <td>
                          <Link href={`/admin/artworks`} className="action-btn">View all</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
