import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getAuthUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function GET() {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { name, type, ticker, quantity, avg_price, current_price, invested_amount, date } = body

  if (!name || !type || !quantity || !avg_price || !date) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('investments')
    .insert({
      user_id: user.id,
      name,
      type,
      ticker: ticker || null,
      quantity: Number(quantity),
      avg_price: Number(avg_price),
      current_price: Number(current_price ?? avg_price),
      invested_amount: Number(invested_amount || quantity * avg_price),
      date,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
