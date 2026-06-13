import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KLAUSEN ART — Where Art Meets Intelligence',
  description: 'Pushing the boundaries of imagination — where human creativity meets artificial intelligence and the permanence of blockchain.',
  openGraph: {
    title: 'KLAUSEN ART',
    description: 'Art · Intelligence · Blockchain',
    url: 'https://klausenart.com',
    siteName: 'KLAUSEN ART',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
