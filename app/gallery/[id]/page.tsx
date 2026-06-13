'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import type { Artwork, Collection } from '@/lib/supabase'

type ArtworkFull = Artwork & {
  collections: Pick<Collection, 'id' | 'name'> | null
}

const PRICES: { key: keyof Artwork; label: string; symbol: string }[] = [
  { key: 'price_sol',   label: 'Solana',   symbol: 'SOL'   },
  { key: 'price_usdc',  label: 'USD Coin', symbol: 'USDC'  },
  { key: 'price_imout', label: 'IMOUT',    symbol: 'IMOUT' },
  { key: 'price_kart',  label: 'KART',     symbol: 'KART'  },
]

export default function ArtworkDetailPage() {
  const params    = useParams()
  const id        = Array.isArray(params.id) ? params.id[0] : params.id as string

  const [artwork,  setArtwork]  = useState<ArtworkFull | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      // Fetch artwork without a join so the query never fails due to a
      // missing FK relationship in the Supabase schema cache.
      const { data: artData, error: artError } = await supabase
        .from('artworks')
        .select('*')
        .eq('id', id)
        .eq('status', 'listed')
        .maybeSingle()

      if (artError) {
        console.error('[gallery/[id]] artwork fetch error:', artError.message)
        setNotFound(true)
        setLoading(false)
        return
      }

      if (!artData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // Fetch collection separately only when needed.
      let collection: Pick<Collection, 'id' | 'name'> | null = null
      if (artData.collection_id) {
        const { data: colData, error: colError } = await supabase
          .from('collections')
          .select('id, name')
          .eq('id', artData.collection_id)
          .maybeSingle()
        if (colError) {
          console.error('[gallery/[id]] collection fetch error:', colError.message)
        }
        collection = colData ?? null
      }

      setArtwork({ ...artData, collections: collection })
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <>
        <Nav />
        <main className="artwork-detail-page">
          <div className="artwork-detail-loading">
            <span className="profile-spinner" />
          </div>
        </main>
      </>
    )
  }

  if (notFound || !artwork) {
    return (
      <>
        <Nav />
        <main className="artwork-detail-page">
          <div className="wrap artwork-not-found">
            <p className="sec-label">404</p>
            <h1 className="artwork-detail-title">Work not found</h1>
            <p className="artwork-detail-desc" style={{ marginTop: '1rem' }}>
              This work may have been removed or is no longer listed.
            </p>
            <Link href="/gallery" className="btn-outline" style={{ display: 'inline-block', marginTop: '2rem' }}>
              ← Back to gallery
            </Link>
          </div>
        </main>
      </>
    )
  }

  const availablePrices = PRICES.filter(p => artwork[p.key] != null)
  const hasMedia        = artwork.image_url || artwork.video_url

  return (
    <>
      <Nav />
      <main className="artwork-detail-page">
        <div className="wrap">

          {/* ── Back link ─────────────────────────────── */}
          <Link href="/gallery" className="artwork-back">← Gallery</Link>

          {/* ── Main grid ─────────────────────────────── */}
          <div className="artwork-detail-grid">

            {/* Media */}
            <div className="artwork-detail-media-wrap">
              {artwork.image_url ? (
                <img
                  src={artwork.image_url}
                  alt={artwork.title}
                  className="artwork-detail-img"
                />
              ) : artwork.video_url ? (
                <video
                  src={artwork.video_url}
                  controls
                  className="artwork-detail-video"
                />
              ) : (
                <div className="artwork-detail-placeholder" aria-hidden="true" />
              )}

              {/* Show video below image if both exist */}
              {artwork.image_url && artwork.video_url && (
                <div className="artwork-detail-video-extra">
                  <p className="artwork-detail-video-label">Video</p>
                  <video src={artwork.video_url} controls className="artwork-detail-video" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="artwork-detail-info">

              {/* Breadcrumb meta */}
              <div className="artwork-detail-meta">
                {artwork.collections?.name && (
                  <span className="artwork-detail-collection">
                    {artwork.collections.name}
                  </span>
                )}
                {artwork.is_nft && (
                  <span className="artwork-nft-badge artwork-nft-badge--lg">NFT</span>
                )}
              </div>

              <h1 className="artwork-detail-title">{artwork.title}</h1>

              {artwork.description && (
                <p className="artwork-detail-desc">{artwork.description}</p>
              )}

              {/* Prices */}
              {availablePrices.length > 0 && (
                <div className="artwork-price-block">
                  <p className="artwork-price-block-label">Price</p>
                  <div className="artwork-price-table">
                    {availablePrices.map(({ key, label, symbol }) => (
                      <div key={key} className="artwork-price-table-row">
                        <div className="artwork-price-table-currency">
                          <span className="artwork-price-table-symbol">{symbol}</span>
                          <span className="artwork-price-table-name">{label}</span>
                        </div>
                        <span className="artwork-price-table-value">
                          {String(artwork[key])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buy */}
              <div className="artwork-buy-section">
                <button className="btn-fire artwork-buy-btn" disabled aria-disabled="true">
                  Buy Now
                </button>
                <p className="artwork-buy-note">Purchase functionality coming soon.</p>
              </div>

              {/* NFT info */}
              {artwork.is_nft && (
                <div className="artwork-nft-block">
                  <p className="artwork-price-block-label">NFT Details</p>
                  {artwork.nft_mint_address ? (
                    <div className="artwork-nft-mint">
                      <span className="artwork-price-table-symbol">Mint</span>
                      <span className="artwork-mint-address">{artwork.nft_mint_address}</span>
                    </div>
                  ) : (
                    <p className="artwork-nft-pending">Minting in progress.</p>
                  )}
                </div>
              )}

              {/* Created date */}
              <p className="artwork-detail-date">
                Added {new Date(artwork.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>

            </div>
          </div>

        </div>
      </main>
    </>
  )
}
