'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PhantomWalletName } from '@solana/wallet-adapter-phantom'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { TOKEN_MINTS } from '@/lib/solana'
import { sendSolPayment, sendSplPayment, recordTransaction } from '@/lib/buyflow'
import type { Artwork, Collection } from '@/lib/supabase'

type ArtworkFull = Artwork & {
  collections: Pick<Collection, 'id' | 'name'> | null
}

type BuyState =
  | { status: 'idle' }
  | { status: 'buying'; currency: string }
  | { status: 'success'; signature: string; currency: string }
  | { status: 'error'; message: string }

const PRICES: { key: keyof Artwork; label: string; symbol: string }[] = [
  { key: 'price_sol',   label: 'Solana',   symbol: 'SOL'   },
  { key: 'price_usdc',  label: 'USD Coin', symbol: 'USDC'  },
  { key: 'price_imout', label: 'IMOUT',    symbol: 'IMOUT' },
  { key: 'price_kart',  label: 'KART',     symbol: 'KART'  },
]

export default function ArtworkDetailPage() {
  const params = useParams()
  const id     = Array.isArray(params.id) ? params.id[0] : params.id as string

  const { user }                                         = useAuth()
  const { publicKey, sendTransaction, connected, select } = useWallet()
  const { connection }                                   = useConnection()

  const [artwork,  setArtwork]  = useState<ArtworkFull | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [buyState, setBuyState] = useState<BuyState>({ status: 'idle' })

  useEffect(() => {
    if (!id) return
    async function load() {
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

      let collection: Pick<Collection, 'id' | 'name'> | null = null
      if (artData.collection_id) {
        const { data: colData, error: colError } = await supabase
          .from('collections')
          .select('id, name')
          .eq('id', artData.collection_id)
          .maybeSingle()
        if (colError) console.error('[gallery/[id]] collection fetch error:', colError.message)
        collection = colData ?? null
      }

      setArtwork({ ...artData, collections: collection })
      setLoading(false)
    }
    load()
  }, [id])

  async function handleBuy(symbol: string, amount: number) {
    if (!publicKey || !artwork) return
    setBuyState({ status: 'buying', currency: symbol })
    try {
      let sig: string
      if (symbol === 'SOL') {
        sig = await sendSolPayment(amount, publicKey, connection, sendTransaction)
      } else {
        const mintAddress = TOKEN_MINTS[symbol as keyof typeof TOKEN_MINTS]
        sig = await sendSplPayment(mintAddress, amount, publicKey, connection, sendTransaction)
      }
      await recordTransaction(artwork.id, user?.id ?? null, amount, symbol, sig)
      setBuyState({ status: 'success', signature: sig, currency: symbol })
      setArtwork(prev => prev ? { ...prev, status: 'sold' } : prev)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed. Please try again.'
      setBuyState({ status: 'error', message: msg })
    }
  }

  // ── Loading ──────────────────────────────────────────────────
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

  // ── Not found ────────────────────────────────────────────────
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
  const isSold          = artwork.status === 'sold'

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
                <img src={artwork.image_url} alt={artwork.title} className="artwork-detail-img" />
              ) : artwork.video_url ? (
                <video src={artwork.video_url} controls className="artwork-detail-video" />
              ) : (
                <div className="artwork-detail-placeholder" aria-hidden="true" />
              )}

              {artwork.image_url && artwork.video_url && (
                <div className="artwork-detail-video-extra">
                  <p className="artwork-detail-video-label">Video</p>
                  <video src={artwork.video_url} controls className="artwork-detail-video" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="artwork-detail-info">

              <div className="artwork-detail-meta">
                {artwork.collections?.name && (
                  <span className="artwork-detail-collection">{artwork.collections.name}</span>
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

              {/* ── Buy section ───────────────────────── */}
              <div className="artwork-buy-section">

                {isSold ? (
                  <p className="artwork-sold-label">Sold</p>

                ) : buyState.status === 'success' ? (
                  <div className="artwork-buy-success">
                    <p className="artwork-buy-success-title">Purchase Complete</p>
                    <p className="artwork-buy-success-sub">
                      {buyState.currency} transaction confirmed on Solana
                    </p>
                    <a
                      href={`https://solscan.io/tx/${buyState.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="artwork-tx-link"
                    >
                      View on Solscan →
                    </a>
                  </div>

                ) : buyState.status === 'error' ? (
                  <div className="artwork-buy-error-block">
                    <p className="artwork-buy-error-msg">{buyState.message}</p>
                    <button
                      className="btn-outline"
                      onClick={() => setBuyState({ status: 'idle' })}
                      style={{ marginTop: '0.75rem' }}
                    >
                      Try Again
                    </button>
                  </div>

                ) : !connected ? (
                  <button
                    className="btn-fire artwork-buy-btn"
                    onClick={() => select(PhantomWalletName)}
                  >
                    Connect Wallet to Buy
                  </button>

                ) : availablePrices.length === 0 ? (
                  <p className="artwork-buy-note">Price not set.</p>

                ) : (
                  <div className="artwork-buy-buttons">
                    {availablePrices.map(({ key, label, symbol }) => {
                      const amount   = artwork[key] as number
                      const isBuying = buyState.status === 'buying' && buyState.currency === symbol
                      return (
                        <button
                          key={key}
                          className="btn-fire artwork-buy-btn"
                          disabled={buyState.status === 'buying'}
                          onClick={() => handleBuy(symbol, amount)}
                        >
                          {isBuying ? 'Processing…' : `Buy with ${symbol} · ${amount}`}
                        </button>
                      )
                    })}
                  </div>
                )}

              </div>
              {/* ── /Buy section ──────────────────────── */}

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
