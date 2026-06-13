import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCollection } from '@/lib/metaplex'
import type { Network } from '@/lib/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name:        string
      description: string
      imageUrl:    string
      network:     Network
    }

    const { name, description, imageUrl, network } = body

    if (!name)     return Response.json({ error: 'name is required' },     { status: 400 })
    if (!imageUrl) return Response.json({ error: 'imageUrl is required' }, { status: 400 })
    if (!network)  return Response.json({ error: 'network is required' },  { status: 400 })

    const { collectionMint, signature } = await createCollection({ name, description, imageUrl, network })

    const { error: dbErr } = await supabase.from('collections').insert({
      name,
      description:          description || null,
      cover_image_url:      imageUrl,
      nft_collection_mint:  collectionMint,
      network,
      is_public:            false,
    })
    if (dbErr) console.error('[api/mint/collection] db insert:', dbErr.message)

    return Response.json({ collectionMint, signature })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Collection creation failed'
    console.error('[api/mint/collection]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
