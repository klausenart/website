import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('artworks')
    .select('id, title, status, image_url, is_nft, series_id')
    .order('title')

  if (error) {
    console.error('[api/admin/artworks]', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const body = await request.json()

  const { error } = await supabaseAdmin
    .from('artworks')
    .update(body)
    .eq('id', id)

  if (error) {
    console.error('[api/admin/artworks] PATCH:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
