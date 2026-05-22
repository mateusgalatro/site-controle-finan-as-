'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Wallet, PiggyBank, Banknote, TrendingUp } from 'lucide-react'
import { createAccount, deleteAccount, listAccounts } from '@/lib/supabase/data'

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Conta Corrente', icon: Wallet },
  { value: 'savings', label: 'Poupança', icon: PiggyBank },
  { value: 'wallet', label: 'Carteira', icon: Banknote },
  { value: 'investment', label: 'Investimento', icon: TrendingUp },
]

function AccountIcon({ type }) {
  const found = ACCOUNT_TYPES.find((t) => t.value === type)
  const Icon = found?.icon || Wallet
  return <Icon size={20} />
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', type: 'checking', balance: '' })

  async function loadAccounts() {
    setLoading(true)
    const data = await listAccounts()
    setAccounts(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAccounts() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.type) {
      setError('Nome e tipo são obrigatórios.')
      return
    }
    setSaving(true)
    await createAccount({ ...form, balance: Number(form.balance) || 0 })
    setOpen(false)
    setForm({ name: '', type: 'checking', balance: '' })
    setSaving(false)
    loadAccounts()
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir esta conta? Todas as transações associadas também serão removidas.')) return
    await deleteAccount(id)
    loadAccounts()
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie suas contas financeiras</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
          <Plus size={16} /> Nova Conta
        </Button>
      </div>

      {/* Saldo total */}
      <Card className="bg-indigo-600 text-white border-0">
        <CardContent className="p-6">
          <p className="text-indigo-200 text-sm font-medium">Saldo Total em Contas</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center py-12 text-gray-400 text-sm">Carregando...</p>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-400 text-sm">Nenhuma conta cadastrada.</p>
          <Button onClick={() => setOpen(true)} variant="outline" className="mt-4 gap-2">
            <Plus size={16} /> Criar primeira conta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((a) => {
            const typeInfo = ACCOUNT_TYPES.find((t) => t.value === a.type)
            return (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                        <AccountIcon type={a.type} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{a.name}</h3>
                        <Badge variant="secondary" className="text-xs mt-0.5">{typeInfo?.label || a.type}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <p className={`text-2xl font-bold ${Number(a.balance) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(Number(a.balance))}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal nova conta */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nome da Conta *</label>
              <Input placeholder="Ex: Nubank, Bradesco..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Tipo *</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Saldo Inicial</label>
              <Input type="number" step="0.01" placeholder="0,00" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                {saving ? 'Salvando...' : 'Criar Conta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
