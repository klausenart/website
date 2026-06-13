'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { PhantomWalletName } from '@solana/wallet-adapter-phantom'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  // ── Phantom wallet ────────────────────────────────────────
  const {
    wallets,
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
  } = useWallet()

  const phantomEntry   = wallets.find(w => w.adapter.name === 'Phantom')
  const phantomState   = phantomEntry?.readyState ?? WalletReadyState.NotDetected
  const publicKeyStr   = publicKey?.toBase58() ?? null

  const [walletSaved,  setWalletSaved]  = useState(false)
  const [walletError,  setWalletError]  = useState<string | null>(null)

  // Save address to Supabase whenever a wallet connects
  useEffect(() => {
    if (!connected || !publicKeyStr || !user) return
    setWalletError(null)

    async function persist() {
      // Upsert into wallets table (one row per profile)
      // Check if this address is already recorded for this profile
      const { data: existing } = await supabase
        .from('wallets')
        .select('id')
        .eq('profile_id', user!.id)
        .eq('address', publicKeyStr)
        .maybeSingle()

      if (!existing) {
        const { error: wErr } = await supabase
          .from('wallets')
          .insert({ profile_id: user!.id, address: publicKeyStr })

        if (wErr) {
          setWalletError(wErr.message)
          return
        }
      }

      // Keep profiles.wallet_address in sync for backward compat
      await supabase
        .from('profiles')
        .update({ wallet_address: publicKeyStr })
        .eq('id', user!.id)

      setWalletSaved(true)
      setTimeout(() => setWalletSaved(false), 4000)
    }

    persist()
  }, [connected, publicKeyStr, user?.id])

  function handleConnect() {
    setWalletError(null)
    // select() triggers autoConnect inside WalletProvider
    select(PhantomWalletName)
  }

  // ── Auth guard ────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <>
        <Nav />
        <main className="profile-page profile-loading">
          <span className="profile-spinner" />
        </main>
      </>
    )
  }

  const displayName = profile?.display_name ?? profile?.username ?? user.email?.split('@')[0] ?? 'Collector'
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : new Date().getFullYear()

  return (
    <>
      <Nav />
      <main className="profile-page">
        <div className="wrap">

          {/* ── Header ──────────────────────────────────── */}
          <div className="profile-header">
            <div className="profile-avatar">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={displayName} />
                : <span className="profile-avatar-initials">{displayName[0].toUpperCase()}</span>
              }
            </div>
            <div className="profile-meta">
              <p className="sec-label">Profile</p>
              <h1 className="profile-name">{displayName}</h1>
              {profile?.username && (
                <p className="profile-handle">@{profile.username}</p>
              )}
              <p className="profile-since">
                Member since {memberSince}
                {profile?.role === 'admin' && (
                  <span className="profile-badge">Admin</span>
                )}
              </p>
            </div>
            <button
              onClick={async () => { await signOut(); router.push('/') }}
              className="btn-outline profile-signout"
            >
              Sign Out
            </button>
          </div>

          {/* ── Phantom Wallet ──────────────────────────── */}
          <div className="profile-section">
            <div className="profile-section-head">
              <p className="sec-label">Wallet</p>
              <h2 className="profile-section-title">Phantom Wallet</h2>
              <p className="profile-section-sub">
                Connect your Phantom wallet to collect and trade KLAUSEN ART pieces on Solana.
              </p>
            </div>

            {walletError && <div className="auth-error" style={{ marginBottom: '1rem' }}>{walletError}</div>}

            {connected && publicKeyStr ? (
              /* ── Connected state ── */
              <div className="wallet-connected">
                <div className="wallet-ph-status">
                  <span className="wallet-ph-dot" />
                  <span className="wallet-ph-label">Connected via Phantom</span>
                  {walletSaved && <span className="wallet-success">✓ Saved</span>}
                </div>
                <p className="wallet-address wallet-address--full">{publicKeyStr}</p>
                <button
                  onClick={() => disconnect()}
                  className="btn-outline wallet-edit-btn"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              /* ── Not connected ── */
              <div className="wallet-connect-section">
                {phantomState === WalletReadyState.NotDetected ||
                 phantomState === WalletReadyState.Unsupported ? (
                  <div className="wallet-not-installed">
                    <p className="wallet-empty">Phantom not detected in this browser.</p>
                    <a
                      href="https://phantom.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-fire"
                      style={{ display: 'inline-block' }}
                    >
                      Install Phantom →
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="wallet-ph-btn"
                  >
                    {connecting ? (
                      <>
                        <span className="wallet-ph-spinner" />
                        Connecting…
                      </>
                    ) : (
                      <>
                        <span className="wallet-ph-icon">◎</span>
                        Connect Phantom
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Account Info ────────────────────────────── */}
          <div className="profile-section">
            <div className="profile-section-head">
              <p className="sec-label">Account</p>
              <h2 className="profile-section-title">Account Info</h2>
            </div>
            <div className="profile-info-grid">
              <div className="profile-info-row">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">{user.email}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-label">Username</span>
                <span className="profile-info-value">{profile?.username ?? '—'}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-label">Role</span>
                <span className="profile-info-value">{profile?.role ?? 'user'}</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
