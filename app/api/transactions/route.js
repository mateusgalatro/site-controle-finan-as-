import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getAuthUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function GET(request) {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  let query = supabase
    .from('transactions')
    .select('*, accounts(name), categories(name, color, icon)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (month && year) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = `${year}-${String(month).padStart(2, '0')}-31`
    query = query.gte('date', start).lte('date', end)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { account_id, category_id, amount, type, description, date } = body

  if (!account_id || !amount || !type || !description || !date) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id,
      category_id: category_id || null,
      amount: Number(amount),
      type,
      description,
      date,
    })
    .select()
    .single()

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

  // Atualiza o saldo da conta
  const { data: account } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', account_id)
    .single()

  if (account) {
    const newBalance = type === 'income'
      ? Number(account.balance) + Number(amount)
      : Number(account.balance) - Number(amount)

    await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', account_id)
  }

  return NextResponse.json(transaction, { status: 201 })
}
