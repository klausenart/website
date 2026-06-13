'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

const NAV = [
  { href: '/admin',             label: 'Overview',    icon: '◈' },
  { href: '/admin/artworks',    label: 'Artworks',    icon: '◻' },
  { href: '/admin/collections', label: 'Collections', icon: '◫' },
]

const BORDER   = '1px solid rgba(255,255,255,0.08)'
const FONT_MONO = "'Space Mono', monospace"
const FONT_SYNE = "'Syne', sans-serif"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace('/')
  }, [loading, user, isAdmin, router])

  if (loading || !user || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
        <span className="profile-spinner" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%', background: '#080808' }}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <div style={{
        width: '220px',
        minWidth: '220px',
        borderRight: BORDER,
        padding: '2rem 1.5rem',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: BORDER }}>
          <img
            src="/logo.png"
            alt=""
            style={{ width: '28px', height: '28px', objectFit: 'contain', opacity: 0.85, flexShrink: 0 }}
          />
          <div>
            <p style={{ fontFamily: FONT_SYNE, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#F5F5F3', margin: 0 }}>
              Klausen Art
            </p>
            <p style={{ fontFamily: FONT_MONO, fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#FF5C00', margin: '0.15rem 0 0' }}>
              Admin
            </p>
          </div>
        </div>

        {/* Nav links — using div, NOT nav (global nav{} CSS is position:fixed) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {NAV.map(({ href, label, icon }) => {
            const exact  = href === '/admin'
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            '0.75rem',
                  padding:        '0.75rem 0.5rem',
                  marginLeft:     '-0.5rem',
                  marginRight:    '-1.5rem',
                  paddingRight:   '1.5rem',
                  fontFamily:     FONT_MONO,
                  fontSize:       '0.62rem',
                  letterSpacing:  '0.15em',
                  textTransform:  'uppercase',
                  color:          active ? '#FF5C00' : 'rgba(245,245,243,0.4)',
                  background:     active ? 'rgba(255,92,0,0.06)' : 'transparent',
                  borderRight:    active ? '2px solid #FF5C00' : '2px solid transparent',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ paddingTop: '1.2rem', borderTop: BORDER }}>
          <Link
            href="/"
            style={{
              fontFamily:     FONT_MONO,
              fontSize:       '0.58rem',
              letterSpacing:  '0.12em',
              textTransform:  'uppercase',
              color:          'rgba(245,245,243,0.4)',
              textDecoration: 'none',
            }}
          >
            ← Back to site
          </Link>
        </div>

      </div>

      {/* ── Main content ────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, padding: '2rem 3rem', overflowX: 'hidden' }}>
        {children}
      </div>

    </div>
  )
}
