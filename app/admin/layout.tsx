'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

const NAV = [
  { href: '/admin', label: 'Overview', icon: '◈' },
  { href: '/admin/artworks', label: 'Artworks', icon: '◻' },
  { href: '/admin/collections', label: 'Collections', icon: '◫' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.replace('/')
  }, [loading, user, isAdmin, router])

  if (loading || !user || !isAdmin) {
    return (
      <div className="admin-gate">
        <span className="profile-spinner" />
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img src="/mark.svg" alt="" className="admin-sidebar-logo" />
          <div>
            <p className="admin-sidebar-name">Klausen Art</p>
            <p className="admin-sidebar-role">Admin</p>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV.map(({ href, label, icon }) => {
            const exact = href === '/admin'
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`admin-nav-link${active ? ' active' : ''}`}
              >
                <span className="admin-nav-icon">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-back-link">← Back to site</Link>
        </div>
      </aside>

      <main className="admin-content">
        {children}
      </main>
    </div>
  )
}
