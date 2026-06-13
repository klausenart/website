import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mintSingleNFT } from '@/lib/metaplex'
import type { Network } from '@/lib/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      artworkId:      string
      collectionMint?: string
      network:        Network
    }

    const { artworkId, collectionMint, network } = body

    if (!artworkId) return Response.json({ error: 'artworkId is required' }, { status: 400 })
    if (!network)   return Response.json({ error: 'network is required' },   { status: 400 })

    const { data: artwork, error: fetchErr } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', artworkId)
      .single()

    if (fetchErr || !artwork) return Response.json({ error: 'Artwork not found' }, { status: 404 })
    if (!artwork.image_url)   return Response.json({ error: 'Artwork has no image — cannot mint' }, { status: 400 })

    const { mint, signature } = await mintSingleNFT({
      name:          artwork.title,
      description:   artwork.description ?? '',
      imageUrl:      artwork.image_url,
      network,
      collectionMint: collectionMint || undefined,
    })

    const { error: updateErr } = await supabase
      .from('artworks')
      .update({ is_nft: true, nft_mint_address: mint })
      .eq('id', artworkId)

    if (updateErr) console.error('[api/mint/single] artwork update:', updateErr.message)

    return Response.json({ mint, signature })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Minting failed'
    console.error('[api/mint/single]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
