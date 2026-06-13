import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('series')
    .select('id, name, description, is_public, creator_id, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[api/admin/series] GET:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    name:        string
    description?: string | null
    is_public?:  boolean
    creator_id?: string | null
  }

  if (!body.name?.trim()) {
    return Response.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('series')
    .insert({
      name:        body.name.trim(),
      description: body.description?.trim() || null,
      is_public:   body.is_public ?? true,
      creator_id:  body.creator_id ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('[api/admin/series] POST:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const body = await request.json()

  const { error } = await supabaseAdmin
    .from('series')
    .update(body)
    .eq('id', id)

  if (error) {
    console.error('[api/admin/series] PATCH:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('series')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[api/admin/series] DELETE:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
