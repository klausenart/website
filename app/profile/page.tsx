'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  const [wallet, setWallet] = useState('')
  const [editingWallet, setEditingWallet] = useState(false)
  const [walletSaving, setWalletSaving] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [walletSuccess, setWalletSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (profile?.wallet_address) setWallet(profile.wallet_address)
  }, [profile])

  async function saveWallet(e: FormEvent) {
    e.preventDefault()
    setWalletError(null)
    setWalletSuccess(false)
    setWalletSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ wallet_address: wallet.trim() || null })
      .eq('id', user!.id)

    setWalletSaving(false)
    if (error) {
      setWalletError(error.message)
    } else {
      setWalletSuccess(true)
      setEditingWallet(false)
      setTimeout(() => setWalletSuccess(false), 3000)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

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

          {/* Header */}
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
            <button onClick={handleSignOut} className="btn-outline profile-signout">
              Sign Out
            </button>
          </div>

          {/* Wallet */}
          <div className="profile-section">
            <div className="profile-section-head">
              <p className="sec-label">Wallet</p>
              <h2 className="profile-section-title">Solana Wallet</h2>
              <p className="profile-section-sub">
                Link your Solana wallet to collect and trade KLAUSEN ART pieces.
              </p>
            </div>

            {!editingWallet ? (
              <div className="wallet-display">
                {profile?.wallet_address ? (
                  <>
                    <p className="wallet-address">{profile.wallet_address}</p>
                    {walletSuccess && (
                      <p className="wallet-success">Wallet saved successfully.</p>
                    )}
                  </>
                ) : (
                  <p className="wallet-empty">No wallet connected.</p>
                )}
                <button
                  className="btn-outline wallet-edit-btn"
                  onClick={() => setEditingWallet(true)}
                >
                  {profile?.wallet_address ? 'Change Wallet' : 'Connect Wallet'}
                </button>
              </div>
            ) : (
              <form onSubmit={saveWallet} className="wallet-form">
                {walletError && <div className="auth-error">{walletError}</div>}
                <div className="form-g">
                  <label htmlFor="wallet">Wallet Address</label>
                  <input
                    id="wallet"
                    type="text"
                    placeholder="Solana wallet address (base58)"
                    value={wallet}
                    onChange={e => setWallet(e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                <div className="wallet-form-actions">
                  <button type="submit" className="btn-fire" disabled={walletSaving}>
                    {walletSaving ? 'Saving…' : 'Save Wallet'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      setEditingWallet(false)
                      setWalletError(null)
                      setWallet(profile?.wallet_address ?? '')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Info */}
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
