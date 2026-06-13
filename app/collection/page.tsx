'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { getConfig } from '@/lib/config'
import { useNetwork } from '@/lib/wallet-context'
import type { Transaction, Artwork } from '@/lib/supabase'

type CollectionItem = Transaction & { artworks: Artwork | null }

export default function CollectionPage() {
  const { user, loading: authLoading } = useAuth()
  const router  = useRouter()
  const network = useNetwork()
  const cfg     = getConfig(network)

  const [items,   setItems]   = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/login'); return }

    supabase
      .from('transactions')
      .select('*, artworks(*)')
      .eq('buyer_id', user.id)
      .eq('network', network)
      .in('status', ['confirmed', 'pending'])
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('[collection] fetch error:', error.message)
        setItems((data as CollectionItem[]) ?? [])
        setLoading(false)
      })
  }, [user, authLoading, router, network])

  if (authLoading || loading) {
    return (
      <>
        <Nav />
        <main style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="profile-spinner" />
        </main>
      </>
    )
  }

  return (
    <>
      <Nav />
      <main style={{ minHeight: '100vh', background: '#080808', paddingTop: '6rem', paddingBottom: '4rem' }}>
        <div className="wrap">

          {/* Header */}
          <div style={{ marginBottom: '3rem' }}>
            <p className="sec-label">Your Wallet</p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#F5F5F3', margin: '0.25rem 0 0' }}>
              My Collection
            </h1>
          </div>

          {/* Empty state */}
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 0' }}>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '2.5rem', marginBottom: '1.5rem', opacity: 0.15 }}>◈</p>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#F5F5F3', marginBottom: '0.75rem' }}>
                Your collection is empty.
              </p>
              <p style={{ color: 'rgba(245,245,243,0.4)', marginBottom: '2rem' }}>
                Explore the gallery and acquire your first piece.
              </p>
              <Link href="/gallery" className="btn-fire" style={{ display: 'inline-block' }}>
                Explore the Gallery →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {items.map(item => (
                <CollectionCard key={item.id} item={item} explorerBase={cfg.explorerBase} network={network} />
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  )
}

function CollectionCard({ item, explorerBase, network }: { item: CollectionItem; explorerBase: string; network: string }) {
  const art = item.artworks

  const date = new Date(item.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div style={{
      background:    '#141414',
      border:        '1px solid rgba(255,255,255,0.08)',
      borderRadius:  '6px',
      overflow:      'hidden',
      display:       'flex',
      flexDirection: 'column',
    }}>

      {/* Image */}
      <div style={{ width: '100%', aspectRatio: '4/3', background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
        {art?.image_url ? (
          <img
            src={art.image_url}
            alt={art.title}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
            <span style={{ fontSize: '3rem' }}>◈</span>
          </div>
        )}

        {/* Status badge */}
        <span style={{
          position:      'absolute',
          top:           '0.75rem',
          right:         '0.75rem',
          fontFamily:    "'Space Mono', monospace",
          fontSize:      '0.55rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          padding:       '3px 7px',
          borderRadius:  '2px',
          background:    item.status === 'confirmed' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
          color:         item.status === 'confirmed' ? '#22c55e' : '#eab308',
          border:        `1px solid ${item.status === 'confirmed' ? '#22c55e' : '#eab308'}`,
        }}>
          {item.status === 'confirmed' ? 'Owned' : 'Pending'}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>

        <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#F5F5F3', margin: 0 }}>
          {art?.title ?? 'Unknown Artwork'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily:    "'Space Mono', monospace",
            fontSize:      '0.75rem',
            color:         '#FF5C00',
            fontWeight:    700,
          }}>
            {item.amount} {item.currency}
          </span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'rgba(245,245,243,0.35)', letterSpacing: '0.05em' }}>
            {date}
          </span>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href={`/gallery/${item.artwork_id}`}
            style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(245,245,243,0.4)', textDecoration: 'none', textTransform: 'uppercase' }}
          >
            View →
          </Link>
          <a
            href={`${explorerBase}/${item.tx_signature}${network === 'devnet' ? '?cluster=devnet' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(245,245,243,0.4)', textDecoration: 'none', textTransform: 'uppercase' }}
          >
            Solscan ↗
          </a>
        </div>

      </div>
    </div>
  )
}
