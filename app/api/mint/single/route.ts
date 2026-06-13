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
      artworkId?:      string
      name?:           string
      description?:    string
      imageUrl?:       string
      collectionMint?: string
      network:         Network
    }

    const { artworkId, collectionMint, network } = body

    if (!network) return Response.json({ error: 'network is required' }, { status: 400 })

    let mintName: string
    let mintDescription: string
    let mintImageUrl: string

    if (artworkId) {
      const { data: artwork, error: fetchErr } = await supabase
        .from('artworks')
        .select('*')
        .eq('id', artworkId)
        .single()

      if (fetchErr || !artwork) return Response.json({ error: 'Artwork not found' }, { status: 404 })
      if (!artwork.image_url)   return Response.json({ error: 'Artwork has no image — cannot mint' }, { status: 400 })

      mintName        = artwork.title
      mintDescription = artwork.description ?? ''
      mintImageUrl    = artwork.image_url
    } else {
      if (!body.name)     return Response.json({ error: 'name is required when no artworkId' },     { status: 400 })
      if (!body.imageUrl) return Response.json({ error: 'imageUrl is required when no artworkId' }, { status: 400 })

      mintName        = body.name
      mintDescription = body.description ?? ''
      mintImageUrl    = body.imageUrl
    }

    const { mint, signature } = await mintSingleNFT({
      name:           mintName,
      description:    mintDescription,
      imageUrl:       mintImageUrl,
      network,
      collectionMint: collectionMint || undefined,
    })

    if (artworkId) {
      const { error: updateErr } = await supabase
        .from('artworks')
        .update({ is_nft: true, nft_mint_address: mint, nft_collection_mint: collectionMint || null })
        .eq('id', artworkId)

      if (updateErr) console.error('[api/mint/single] artwork update:', updateErr.message)
    }

    return Response.json({ mint, signature })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Minting failed'
    console.error('[api/mint/single]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
