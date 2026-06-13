import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Wallet adapter packages ship as ESM and reference browser globals
  // at module evaluation time. Bundling them through Next avoids the
  // "window is not defined" / "module not found" errors in the App Router.
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-phantom',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
  ],
}

export default nextConfig
