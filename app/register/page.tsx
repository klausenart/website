'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const { error } = await signUp(email, password, username)
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      router.push('/profile')
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/mark.svg" alt="KLAUSEN ART" className="auth-logo" />
        </div>

        <p className="sec-label">Join</p>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-sub">Become part of the KLAUSEN ART collector community.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-g">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="your_handle"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-g">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-g">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="min. 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-fire auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already a member?{' '}
          <Link href="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
