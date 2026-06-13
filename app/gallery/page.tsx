'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import type { Artwork, Collection } from '@/lib/supabase'

const CURRENCIES: { key: keyof Artwork; label: string }[] = [
  { key: 'price_sol',   label: 'SOL'   },
  { key: 'price_usdc',  label: 'USDC'  },
  { key: 'price_imout', label: 'IMOUT' },
  { key: 'price_kart',  label: 'KART'  },
]

function ArtworkCard({ art }: { art: Artwork }) {
  const visiblePrices = CURRENCIES.filter(c => art[c.key] != null)

  return (
    <Link href={`/gallery/${art.id}`} className="artwork-card">
      <div className="artwork-card-media">
        {art.image_url ? (
          <img src={art.image_url} alt={art.title} className="artwork-card-img" />
        ) : (
          <div className="artwork-card-placeholder" aria-hidden="true" />
        )}
        {art.video_url && !art.image_url && (
          <video
            src={art.video_url}
            className="artwork-card-img"
            muted
            loop
            playsInline
            autoPlay
          />
        )}
        <div className="artwork-card-overlay">
          <span className="artwork-card-view">View →</span>
        </div>
      </div>

      <div className="artwork-card-body">
        <div className="artwork-card-header">
          <h2 className="artwork-card-title">{art.title}</h2>
          {art.is_nft && <span className="artwork-nft-badge">NFT</span>}
        </div>

        {visiblePrices.length > 0 && (
          <div className="artwork-card-prices">
            {visiblePrices.map(({ key, label }) => (
              <div key={key} className="artwork-price-row">
                <span className="artwork-price-currency">{label}</span>
                <span className="artwork-price-amount">{String(art[key])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export default function GalleryPage() {
  const [artworks, setArtworks]         = useState<Artwork[]>([])
  const [collections, setCollections]   = useState<Pick<Collection, 'id' | 'name'>[]>([])
  const [search, setSearch]             = useState('')
  const [collectionFilter, setFilter]   = useState('all')
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: arts }, { data: cols }] = await Promise.all([
        supabase
          .from('artworks')
          .select('*')
          .eq('status', 'listed')
          .order('created_at', { ascending: false }),
        supabase
          .from('collections')
          .select('id, name')
          .eq('is_public', true)
          .order('name'),
      ])
      setArtworks(arts ?? [])
      setCollections(cols ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return artworks.filter(art => {
      const matchSearch     = !q || art.title.toLowerCase().includes(q)
      const matchCollection = collectionFilter === 'all' || art.collection_id === collectionFilter
      return matchSearch && matchCollection
    })
  }, [artworks, search, collectionFilter])

  const hasFilters = search !== '' || collectionFilter !== 'all'

  return (
    <>
      <Nav />
      <main className="gallery-page">

        {/* ── Hero header ─────────────────────────────── */}
        <div className="gallery-hero wrap">
          <p className="sec-label">Collection</p>
          <h1 className="sec-title">
            The <em>Gallery</em>
          </h1>
          <p className="gallery-hero-sub">
            Original works at the intersection of human vision and machine intelligence.
          </p>
        </div>

        {/* ── Controls ────────────────────────────────── */}
        <div className="gallery-controls wrap">
          <div className="gallery-search-wrap">
            <span className="gallery-search-icon">⌕</span>
            <input
              type="search"
              placeholder="Search works…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="gallery-search"
              aria-label="Search artworks"
            />
          </div>

          <div className="gallery-pills" role="group" aria-label="Filter by collection">
            <button
              onClick={() => setFilter('all')}
              className={`gallery-pill${collectionFilter === 'all' ? ' active' : ''}`}
            >
              All
            </button>
            {collections.map(col => (
              <button
                key={col.id}
                onClick={() => setFilter(col.id)}
                className={`gallery-pill${collectionFilter === col.id ? ' active' : ''}`}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── Result count ────────────────────────────── */}
        {!loading && (
          <div className="gallery-meta wrap">
            <p className="gallery-count">
              {filtered.length} {filtered.length === 1 ? 'work' : 'works'}
              {hasFilters && artworks.length !== filtered.length
                ? ` of ${artworks.length}`
                : ''}
            </p>
          </div>
        )}

        {/* ── Grid ────────────────────────────────────── */}
        <div className="wrap">
          {loading ? (
            <div className="gallery-loading">
              <span className="profile-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="gallery-empty">
              {hasFilters
                ? <>No works match your search. <button className="auth-link" onClick={() => { setSearch(''); setFilter('all') }}>Clear filters</button></>
                : 'No works are currently on show. Check back soon.'}
            </div>
          ) : (
            <div className="gallery-grid">
              {filtered.map(art => <ArtworkCard key={art.id} art={art} />)}
            </div>
          )}
        </div>

      </main>
    </>
  )
}
