'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

type MenuItem = { label: string; href: string; soon?: boolean }
type Menu     = { trigger: string; items: MenuItem[] }

const MENUS: Menu[] = [
  {
    trigger: 'Explore',
    items: [
      { label: 'Gallery',     href: '/gallery' },
      { label: 'Marketplace', href: '/marketplace', soon: true },
      { label: 'NFTs',        href: '/nfts',        soon: true },
      { label: 'Games',       href: '/games',       soon: true },
    ],
  },
  {
    trigger: 'Create',
    items: [
      { label: 'AI Generator', href: '/generate', soon: true },
      { label: 'Submit Work',  href: '/submit',   soon: true },
    ],
  },
  {
    trigger: 'About',
    items: [
      { label: 'Vision',  href: '/#manifesto' },
      { label: 'Process', href: '/#process'   },
      { label: 'Contact', href: '/#contact'   },
    ],
  },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState<string | null>(null)
  const { user, profile, isAdmin, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSignOut() {
    setOpen(null)
    await signOut()
    router.push('/')
  }

  const displayName = profile?.username ?? user?.email?.split('@')[0]

  return (
    <nav className={scrolled ? 'scrolled' : ''}>

      {/* ── Left: Logo ───────────────────────────────── */}
      <Link href="/" className="nav-brand">
        <img src="/logo.png" alt="KLAUSEN ART" className="nav-logo" style={{ opacity: 0.9, width: '32px', height: '32px', objectFit: 'contain' }} />
        <span className="nav-name">Klausen Art</span>
      </Link>

      {/* ── Center: Mega-menu dropdowns ──────────────── */}
      <div className="nav-center">
        {MENUS.map(({ trigger, items }) => {
          const isOpen = open === trigger
          return (
            <div
              key={trigger}
              className="nav-dropdown"
              onMouseEnter={() => setOpen(trigger)}
              onMouseLeave={() => setOpen(null)}
            >
              <button className="nav-dropdown-trigger">
                {trigger}
                <span
                  className="nav-dropdown-arrow"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  ▾
                </span>
              </button>

              {isOpen && (
                <div className="nav-dropdown-menu">
                  <div className="nav-dropdown-panel">
                    {items.map(({ label, href, soon }) =>
                      soon ? (
                        <span key={label} className="nav-dd-item soon">
                          {label}
                          <span className="nav-dd-soon">SOON</span>
                        </span>
                      ) : (
                        <Link
                          key={label}
                          href={href}
                          className="nav-dd-item"
                          onClick={() => setOpen(null)}
                        >
                          {label}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Right: Auth ──────────────────────────────── */}
      <div className="nav-right">
        {user ? (
          /* ── User dropdown ── */
          <div
            className="nav-dropdown"
            onMouseEnter={() => setOpen('user')}
            onMouseLeave={() => setOpen(null)}
          >
            <button className="nav-dropdown-trigger">
              @{displayName}
              <span
                className="nav-dropdown-arrow"
                style={{ transform: open === 'user' ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                ▾
              </span>
            </button>

            {open === 'user' && (
              <div
                className="nav-dropdown-menu"
                style={{ left: 'auto', right: 0, transform: 'none' }}
              >
                <div className="nav-dropdown-panel">
                  <Link href="/profile" className="nav-dd-item" onClick={() => setOpen(null)}>
                    Profile
                  </Link>
                  <span className="nav-dd-item soon">
                    My Collection
                    <span className="nav-dd-soon">SOON</span>
                  </span>
                  {isAdmin && (
                    <Link href="/admin" className="nav-dd-item" onClick={() => setOpen(null)}>
                      Admin
                    </Link>
                  )}
                  <div className="nav-dd-divider" />
                  <button className="nav-dd-item nav-dd-signout" onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        ) : (
          /* ── Logged-out buttons ── */
          <>
            <Link href="/login" className="nav-sign-in">Sign In</Link>
            <Link href="/register" className="nav-register">Register</Link>
          </>
        )}
      </div>

    </nav>
  )
}
