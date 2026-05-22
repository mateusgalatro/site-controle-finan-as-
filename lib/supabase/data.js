import { createClient } from './client'

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function listAccounts() {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createAccount({ name, type, balance }) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Nao autorizado')

  const { data, error } = await supabase
    .from('accounts')
    .insert({ user_id: user.id, name, type, balance: balance || 0 })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAccount(id) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Nao autorizado')

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function listCategories() {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error) throw error
  return data || []
}

export async function createCategory({ name, color, icon }) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Nao autorizado')

  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, name, color: color || '#6366f1', icon: icon || '$' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Nao autorizado')

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function listTransactions({ month, year } = {}) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return []

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
  if (error) throw error
  return data || []
}

export async function createTransaction({ account_id, category_id, amount, type, description, date }) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Nao autorizado')

  const numericAmount = Number(amount)
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id,
      category_id: category_id || null,
      amount: numericAmount,
      type,
      description,
      date,
    })
    .select()
    .single()

  if (txError) throw txError
  await adjustAccountBalance(account_id, type === 'income' ? numericAmount : -numericAmount)
  return transaction
}

export async function deleteTransaction(id) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Nao autorizado')

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('account_id, amount, type')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError) throw fetchError

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error

  if (transaction) {
    const delta = transaction.type === 'income'
      ? -Number(transaction.amount)
      : Number(transaction.amount)
    await adjustAccountBalance(transaction.account_id, delta)
  }
}

async function adjustAccountBalance(accountId, delta) {
  const supabase = createClient()
  const { data: account, error: fetchError } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .single()

  if (fetchError || !account) return

  await supabase
    .from('accounts')
    .update({ balance: Number(account.balance) + delta })
    .eq('id', accountId)
}

export async function listInvestments() {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createInvestment(input) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Nao autorizado')

  const { name, type, ticker, quantity, avg_price, current_price, invested_amount, date } = input
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

  if (error) throw error
  return data
}

export async function updateInvestment(id, input) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Nao autorizado')

  const { error } = await supabase
    .from('investments')
    .update({
      name: input.name,
      type: input.type,
      ticker: input.ticker || null,
      quantity: Number(input.quantity),
      avg_price: Number(input.avg_price),
      current_price: Number(input.current_price),
      invested_amount: Number(input.invested_amount || input.quantity * input.avg_price),
      date: input.date,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function deleteInvestment(id) {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Nao autorizado')

  const { error } = await supabase
    .from('investments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function fetchMarketPrice(ticker) {
  const symbol = toYahooSymbol(ticker)
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`)
  if (!res.ok) throw new Error('Ativo nao encontrado')

  const data = await res.json()
  const meta = data?.chart?.result?.[0]?.meta
  if (!meta?.regularMarketPrice) throw new Error('Preco nao disponivel para este ticker')

  const previousClose = meta.chartPreviousClose || meta.previousClose
  const price = meta.regularMarketPrice
  const changePct = previousClose ? ((price - previousClose) / previousClose) * 100 : 0

  return {
    ticker: meta.symbol,
    name: meta.longName || meta.shortName || symbol,
    price,
    currency: meta.currency === 'BRL' ? 'BRL' : meta.currency,
    changePct,
    updatedAt: new Date().toISOString(),
  }
}

function toYahooSymbol(ticker) {
  const value = ticker.trim().toUpperCase()
  if (value.includes('.') || value.includes('-')) return value

  const cryptoMap = { BTC: 'BTC-USD', ETH: 'ETH-USD', SOL: 'SOL-USD', BNB: 'BNB-USD' }
  if (cryptoMap[value]) return cryptoMap[value]

  return `${value}.SA`
}
