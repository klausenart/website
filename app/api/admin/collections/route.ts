import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('collections')
    .select('id, name, nft_collection_mint, network')
    .order('name')

  if (error) {
    console.error('[api/admin/collections]', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
