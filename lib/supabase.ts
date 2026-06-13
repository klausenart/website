import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export type Profile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  wallet_address: string | null
  role: 'user' | 'admin'
  created_at: string
}

export type Artwork = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  video_url: string | null
  price_sol: number | null
  price_usdc: number | null
  price_imout: number | null
  price_kart: number | null
  is_nft: boolean
  nft_mint_address: string | null
  collection_id: string | null
  creator_id: string | null
  status: 'draft' | 'listed' | 'sold'
  created_at: string
}

export type Collection = {
  id: string
  name: string
  description: string | null
  cover_image_url: string | null
  creator_id: string | null
  is_public: boolean
  created_at: string
}

export type Transaction = {
  id: string
  artwork_id: string
  buyer_id: string
  seller_id: string
  amount: number
  currency: 'SOL' | 'USDC' | 'IMOUT' | 'KART'
  tx_signature: string
  status: 'pending' | 'confirmed' | 'failed'
  created_at: string
}
