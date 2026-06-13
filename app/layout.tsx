import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { WalletProvider } from '@/lib/wallet-context'

export const metadata: Metadata = {
  title: 'KLAUSEN ART — Where Art Meets Intelligence',
  description: 'Pushing the boundaries of imagination — where human creativity meets artificial intelligence and the permanence of blockchain.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
