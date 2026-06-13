import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('artworks')
    .select('id, title, status, image_url, is_nft')
    .order('title')

  if (error) {
    console.error('[api/admin/artworks]', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
