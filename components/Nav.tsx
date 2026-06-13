'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const { user, profile, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <Link href="/" className="nav-brand">
        <img src="/mark.svg" alt="KLAUSEN ART" className="nav-logo" />
        <span className="nav-name">Klausen Art</span>
      </Link>

      <ul className="nav-links">
        <li><Link href="/#manifesto">Manifesto</Link></li>
        <li><Link href="/#portfolio">Work</Link></li>
        <li><Link href="/#process">Process</Link></li>
        <li><Link href="/#contact">Contact</Link></li>
      </ul>

      <div className="nav-auth">
        {user ? (
          <>
            <Link href="/profile" className="nav-user">
              {profile?.username ?? user.email?.split('@')[0]}
            </Link>
            <button onClick={handleSignOut} className="nav-cta nav-signout">Sign Out</button>
          </>
        ) : (
          <>
            <Link href="/login" className="nav-login">Login</Link>
            <Link href="/register" className="nav-cta">Join</Link>
          </>
        )}
      </div>
    </nav>
  )
}
