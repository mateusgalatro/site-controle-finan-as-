import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getAuthUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function PUT(request, { params }) {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const { account_id, category_id, amount, type, description, date } = body
  const { id } = await params

  const { data, error } = await supabase
    .from('transactions')
    .update({ account_id, category_id: category_id || null, amount, type, description, date })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request, { params }) {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  // Busca a transação antes de deletar para reverter o saldo
  const { data: transaction } = await supabase
    .from('transactions')
    .select('account_id, amount, type')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reverte o saldo da conta
  if (transaction) {
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', transaction.account_id)
      .single()

    if (account) {
      const newBalance = transaction.type === 'income'
        ? Number(account.balance) - Number(transaction.amount)
        : Number(account.balance) + Number(transaction.amount)

      await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', transaction.account_id)
    }
  }

  return NextResponse.json({ success: true })
}
