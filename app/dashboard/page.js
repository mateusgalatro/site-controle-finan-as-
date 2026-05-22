'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Wallet, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [totalBalance, setTotalBalance] = useState(0)
  const [monthIncome, setMonthIncome] = useState(0)
  const [monthExpense, setMonthExpense] = useState(0)
  const [totalInvested, setTotalInvested] = useState(0)
  const [categoryData, setCategoryData] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const startOfMonth = `${year}-${month}-01`
      const endOfMonth = `${year}-${month}-31`

      const [accountsRes, transactionsRes, investmentsRes, categoriesRes, recentRes] = await Promise.all([
        supabase.from('accounts').select('balance').eq('user_id', user.id),
        supabase.from('transactions')
          .select('amount, type, category_id')
          .eq('user_id', user.id)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth),
        supabase.from('investments').select('invested_amount').eq('user_id', user.id),
        supabase.from('categories').select('id, name, color').eq('user_id', user.id),
        supabase.from('transactions')
          .select('id, description, amount, type, date, categories(name)')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(5),
      ])

      const balance = (accountsRes.data || []).reduce((sum, a) => sum + Number(a.balance), 0)
      setTotalBalance(balance)

      const invested = (investmentsRes.data || []).reduce((sum, i) => sum + Number(i.invested_amount), 0)
      setTotalInvested(invested)

      let income = 0, expense = 0
      const expenseByCategory = {}
      ;(transactionsRes.data || []).forEach((t) => {
        if (t.type === 'income') income += Number(t.amount)
        else {
          expense += Number(t.amount)
          const key = t.category_id || 'sem_categoria'
          expenseByCategory[key] = (expenseByCategory[key] || 0) + Number(t.amount)
        }
      })
      setMonthIncome(income)
      setMonthExpense(expense)

      const catMap = {}
      ;(categoriesRes.data || []).forEach((c) => { catMap[c.id] = c })

      const pieData = Object.entries(expenseByCategory).map(([key, value]) => ({
        name: catMap[key]?.name || 'Sem categoria',
        value: Number(value.toFixed(2)),
      }))
      setCategoryData(pieData)

      setRecentTransactions(recentRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral das suas finanças</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Wallet className="text-indigo-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Saldo Total</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-green-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Receitas do Mês</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(monthIncome)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="text-red-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Despesas do Mês</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(monthExpense)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-amber-600" size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Patrimônio Investido</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(totalInvested)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">Gastos por Categoria (mês atual)</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhuma despesa registrada este mês.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">Últimas Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhuma transação registrada.</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {t.type === 'income' ? '↑' : '↓'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{t.description}</p>
                        <p className="text-xs text-gray-400">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
